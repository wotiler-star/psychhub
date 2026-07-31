#!/usr/bin/env python3
"""
一键部署到腾讯云轻量服务器（Windows / 无 Docker / 无 SSH）

链路：本地构建 → 打包 → COS 中转 → TAT 远程执行 → 公网验证

用法（PowerShell / Git Bash）：
    export TC_SID=xxx TC_SKEY=yyy
    python scripts/deploy-tencent.py            # 全量：构建 + 上传 + 部署
    python scripts/deploy-tencent.py --skip-build   # 复用上次构建产物
    python scripts/deploy-tencent.py --verify-only  # 只做公网验证

依赖（装在隔离 venv 里即可）：
    pip install tencentcloud-sdk-python-tat tencentcloud-sdk-python-lighthouse cos-python-sdk-v5
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

# ----------------------------------------------------------------- 配置
REGION = "ap-guangzhou"
INSTANCE_ID = "lhins-mprw5b1n"
PUBLIC_IP = "175.178.23.30"
WEB_PORT = 3500
API_PORT = 3501
COS_BUCKET = "ainav-deploy-1456824769"
COS_PREFIX = "psychhub"
REMOTE_ROOT = r"C:\www\psychhub"

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "_dist"
NODE = os.environ.get(
    "NODE_BIN",
    r"C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2/node.exe",
)

SID = os.environ.get("TC_SID") or os.environ.get("TENCENTCLOUD_SECRET_ID")
SKEY = os.environ.get("TC_SKEY") or os.environ.get("TENCENTCLOUD_SECRET_KEY")


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def die(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def run(cmd: list[str], cwd: Path | None = None, env: dict | None = None) -> None:
    e = dict(os.environ)
    if env:
        e.update(env)
    r = subprocess.run(cmd, cwd=str(cwd or ROOT), env=e)
    if r.returncode != 0:
        die(f"command failed ({r.returncode}): {' '.join(cmd)}")


# ----------------------------------------------------------------- 1. 构建
def build() -> None:
    web = ROOT / "web"
    log("清理 web/.next ...")
    shutil.rmtree(web / ".next", ignore_errors=True)

    log("构建 Next.js standalone（API 地址在构建期固化）...")
    run(
        [NODE, "node_modules/next/dist/bin/next", "build"],
        cwd=web,
        env={"NEXT_PUBLIC_API_BASE": f"http://127.0.0.1:{API_PORT}"},
    )

    log("esbuild 打包数据服务为零依赖单文件 ...")
    (DIST / "api").mkdir(parents=True, exist_ok=True)
    script = (
        "const esbuild=require('esbuild');"
        "esbuild.build({entryPoints:['backend/scripts/preview-server.ts'],"
        "bundle:true,platform:'node',target:'node18',format:'cjs',"
        "outfile:'_dist/api/server.js',logLevel:'warning'})"
        ".then(()=>console.log('BUNDLE_OK')).catch(e=>{console.error(e);process.exit(1)});"
    )
    run([NODE, "-e", script], env={"NODE_PATH": str(ROOT / "web" / "node_modules")})

    log("组装部署目录 ...")
    wd = DIST / "web"
    shutil.rmtree(wd, ignore_errors=True)
    shutil.copytree(web / ".next" / "standalone", wd)
    (wd / ".next").mkdir(exist_ok=True)
    shutil.copytree(web / ".next" / "static", wd / ".next" / "static")
    if (web / "public").exists():
        shutil.copytree(web / "public", wd / "public", dirs_exist_ok=True)

    log("压缩 app.zip ...")
    app_zip = DIST / "app.zip"
    if app_zip.exists():
        app_zip.unlink()
    with zipfile.ZipFile(app_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for sub in ("web", "api"):
            base = DIST / sub
            for p in base.rglob("*"):
                if p.is_file():
                    z.write(p, str(Path(sub) / p.relative_to(base)))
    log(f"app.zip = {app_zip.stat().st_size / 1048576:.2f} MB")

    log("打包源代码 source.zip ...")
    ex = {"node_modules", ".next", "_dist", ".git", "dist", "coverage", ".turbo", ".vscode", "_smoke"}
    src_zip = DIST / "source.zip"
    if src_zip.exists():
        src_zip.unlink()
    n = 0
    with zipfile.ZipFile(src_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for root, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if d not in ex]
            for f in files:
                p = Path(root) / f
                try:
                    z.write(p, str(p.relative_to(ROOT)))
                    n += 1
                except Exception:
                    pass
    log(f"source.zip = {n} files / {src_zip.stat().st_size / 1048576:.2f} MB")


# ----------------------------------------------------------------- 2. COS
def cos_client():
    from qcloud_cos import CosConfig, CosS3Client

    return CosS3Client(CosConfig(Region=REGION, SecretId=SID, SecretKey=SKEY))


def upload() -> tuple[str, str]:
    c = cos_client()
    urls = {}
    for name in ("app.zip", "source.zip"):
        p = DIST / name
        if not p.exists():
            die(f"missing {p} — 先跑一次不带 --skip-build 的部署")
        key = f"{COS_PREFIX}/{name}"
        log(f"上传 {name} ({p.stat().st_size / 1048576:.2f} MB) → cos://{COS_BUCKET}/{key}")
        c.upload_file(Bucket=COS_BUCKET, Key=key, LocalFilePath=str(p), PartSize=5, MAXThread=4)
        urls[name] = c.get_presigned_download_url(Bucket=COS_BUCKET, Key=key, Expired=7200)
    return urls["app.zip"], urls["source.zip"]


# ----------------------------------------------------------------- 3. TAT
def tat_run(ps_text: str, timeout: int = 900) -> str:
    from tencentcloud.common import credential
    from tencentcloud.tat.v20201028 import models, tat_client

    cli = tat_client.TatClient(credential.Credential(SID, SKEY), REGION)

    req = models.RunCommandRequest()
    req.from_json_string(
        json.dumps(
            {
                "Content": base64.b64encode(ps_text.encode("utf-8")).decode(),
                "InstanceIds": [INSTANCE_ID],
                "CommandType": "POWERSHELL",
                "Timeout": timeout,
                "Username": "System",
            }
        )
    )
    inv = json.loads(cli.RunCommand(req).to_json_string())["InvocationId"]
    log(f"TAT InvocationId = {inv}")

    deadline = time.time() + timeout + 120
    last = None
    while time.time() < deadline:
        time.sleep(5)
        q = models.DescribeInvocationTasksRequest()
        q.from_json_string(
            json.dumps(
                {
                    "Filters": [{"Name": "invocation-id", "Values": [inv]}],
                    "HideOutput": False,
                }
            )
        )
        tasks = json.loads(cli.DescribeInvocationTasks(q).to_json_string()).get(
            "InvocationTaskSet", []
        )
        if not tasks:
            continue
        t = tasks[0]
        # 注意：字段名是 TaskStatus，不是 TaskState
        st = t.get("TaskStatus")
        if st != last:
            log(f"  [state] {st}")
            last = st
        if st in ("SUCCESS", "FAILED", "TIMEOUT", "START_FAILED", "TERMINATED"):
            out = t.get("TaskResult", {}) or {}
            txt = out.get("Output") or ""
            try:
                txt = base64.b64decode(txt).decode("utf-8", "ignore")
            except Exception:
                pass
            print(f"=== EXIT: {out.get('ExitCode')} ===")
            print(txt)
            if st != "SUCCESS":
                die(f"TAT task {st}")
            return txt
    die("TAT 轮询超时")
    return ""


REMOTE_UPDATE = r"""
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# 关键：TAT 以 SYSTEM 执行，PATH 里没有 node，pm2.cmd 会报 '"node" is not recognized'
# 必须显式补 PATH，并直接用 node 调 pm2 的入口 js
$env:PM2_HOME = "C:\Users\Administrator\.pm2"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
$nodeExe = "C:\Program Files\nodejs\node.exe"
$pm2js   = "C:\Users\Administrator\AppData\Roaming\npm\node_modules\pm2\bin\pm2"
function Pm2($a) { & $nodeExe $pm2js @a 2>&1 | Out-String }

$root = "C:\www\psychhub"
$tmp  = "C:\Windows\Temp\psychhub-deploy"

Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $tmp  | Out-Null
New-Item -ItemType Directory -Force -Path $root | Out-Null

Write-Output "=== DOWNLOAD ==="
Invoke-WebRequest -Uri "__APP_URL__" -OutFile "$tmp\app.zip" -UseBasicParsing
Invoke-WebRequest -Uri "__SRC_URL__" -OutFile "$tmp\source.zip" -UseBasicParsing
"app.zip    {0} bytes" -f (Get-Item "$tmp\app.zip").Length
"source.zip {0} bytes" -f (Get-Item "$tmp\source.zip").Length

Write-Output "=== EXPAND TO TEMP ==="
Expand-Archive -Path "$tmp\app.zip" -DestinationPath "$tmp\app" -Force
if (-not (Test-Path "$tmp\app\web\server.js")) { throw "bad package: missing web\server.js" }
if (-not (Test-Path "$tmp\app\api\server.js")) { throw "bad package: missing api\server.js" }
"staged web files: {0}" -f (Get-ChildItem "$tmp\app\web" -Recurse -File).Count

# 必须先停进程再删目录：Windows 上运行中的 server.js 会锁文件，
# Remove-Item 会部分失败，随后 Move-Item 会把内容嵌套成 web\web\server.js（曾踩坑）
Write-Output "=== STOP ==="
Pm2 @("delete","psychhub-web")
Pm2 @("delete","psychhub-api")
Start-Sleep -Seconds 4

Write-Output "=== SWAP DIRS ==="
foreach ($d in @("web","api")) {
  Remove-Item -Recurse -Force "$root\$d" -ErrorAction SilentlyContinue
  if (Test-Path "$root\$d") { throw "cannot remove $root\$d (file lock?)" }
  Move-Item "$tmp\app\$d" "$root\$d"
  if (-not (Test-Path "$root\$d\server.js")) { throw "swap failed: $root\$d\server.js missing" }
}
Remove-Item -Recurse -Force "$root\src" -ErrorAction SilentlyContinue
Expand-Archive -Path "$tmp\source.zip" -DestinationPath "$root\src" -Force
"web files: {0}" -f (Get-ChildItem "$root\web" -Recurse -File).Count
"src files: {0}" -f (Get-ChildItem "$root\src" -Recurse -File).Count

Write-Output "=== START ==="
Set-Location $root
Pm2 @("start","ecosystem.config.js")
Start-Sleep -Seconds 18
Pm2 @("save")
Pm2 @("list") -split "`n" | Select-String "psychhub" | ForEach-Object { $_.ToString() }

Write-Output "=== VERIFY (local) ==="
$fail = 0
foreach ($u in @("http://127.0.0.1:3501/api/health","http://127.0.0.1:3500/","http://127.0.0.1:3500/api/resources")) {
  try {
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 30
    "{0}  => {1}  {2} bytes" -f $u, $r.StatusCode, $r.RawContentLength
  } catch { "{0}  => FAIL {1}" -f $u, $_.Exception.Message; $fail++ }
}
if ($fail -gt 0) {
  Write-Output "--- web error log:"
  Get-Content "C:\Users\Administrator\.pm2\logs\psychhub-web-error.log" -Tail 20 -ErrorAction SilentlyContinue
}

Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
$os = Get-CimInstance Win32_OperatingSystem
"MEM TotalMB={0} FreeMB={1}" -f [int]($os.TotalVisibleMemorySize/1024), [int]($os.FreePhysicalMemory/1024)
if ($fail -gt 0) { exit 1 }
"DONE_UPDATE"
"""


# ----------------------------------------------------------------- 4. 公网验证
PAGES = [
    "/", "/resources", "/counselors", "/articles", "/assessments",
    "/helplines", "/tags", "/saved", "/compare",
    "/api/health", "/api/resources", "/sitemap.xml", "/rss.xml",
]


def verify() -> bool:
    base = f"http://{PUBLIC_IP}:{WEB_PORT}"
    ok = True
    for p in PAGES:
        try:
            t0 = time.time()
            with urllib.request.urlopen(base + p, timeout=25) as r:
                body = r.read()
            flag = "OK " if r.status == 200 and body else "BAD"
            if r.status != 200 or not body:
                ok = False
            print(f"  {flag} {p:<20} {r.status}  {len(body):>7}B  {(time.time()-t0)*1000:.0f}ms")
        except Exception as e:
            ok = False
            print(f"  BAD {p:<20} {e}")
    return ok


# ----------------------------------------------------------------- main
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-build", action="store_true", help="复用 _dist 里已有的构建产物")
    ap.add_argument("--verify-only", action="store_true", help="只做公网验证")
    args = ap.parse_args()

    if args.verify_only:
        log("公网验证 ...")
        sys.exit(0 if verify() else 1)

    if not SID or not SKEY:
        die("请先设置环境变量 TC_SID / TC_SKEY")

    t0 = time.time()
    if not args.skip_build:
        build()
    else:
        log("跳过构建，复用 _dist")

    app_url, src_url = upload()

    log("远程部署 ...")
    tat_run(REMOTE_UPDATE.replace("__APP_URL__", app_url).replace("__SRC_URL__", src_url))

    log("公网验证 ...")
    ok = verify()
    log(f"{'✅ 部署成功' if ok else '❌ 存在失败页面'}  用时 {time.time()-t0:.0f}s")
    print(f"\n站点： http://{PUBLIC_IP}:{WEB_PORT}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
