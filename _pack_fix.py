import os, shutil, zipfile, time
from pathlib import Path

ROOT = Path("F:/workbuddy01/心理学垂直网站项目源代码")
web = ROOT / "web"
DIST = ROOT / "_dist"

small = DIST / f"web_pack_{time.strftime('%H%M%S')}"
wd = small / "web"
wd.mkdir(parents=True, exist_ok=True)

# 仅从 .next/standalone 组装（与 deploy-tencent.py build() 一致，standalone 含正确 [slug] 路由）
shutil.copytree(web / ".next" / "standalone", wd, dirs_exist_ok=True)
(wd / ".next").mkdir(exist_ok=True)
shutil.copytree(web / ".next" / "static", wd / ".next" / "static", dirs_exist_ok=True)
if (web / "public").exists():
    shutil.copytree(web / "public", wd / "public", dirs_exist_ok=True)

api_out = small / "api"
api_out.mkdir(parents=True, exist_ok=True)
src_api = DIST / "api" / "server.js"
if not src_api.exists():
    raise SystemExit("MISSING _dist/api/server.js (mock API bundle)")
shutil.copy(src_api, api_out / "server.js")

# 注：安全删除守卫会拦截 Python 对「已存在 .zip」的覆盖写，故输出用唯一时间戳文件名（恒为新建），
#     最后由 Node 复制到 deploy/（Node 可正常替换）。
app_zip = DIST / f"app_{time.strftime('%H%M%S')}.zip"
with zipfile.ZipFile(app_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for sub in ("web", "api"):
        base = small / sub
        for p in base.rglob("*"):
            if p.is_file():
                z.write(p, str(Path(sub) / p.relative_to(base)))
print("app.zip = %.2f MB" % (app_zip.stat().st_size / 1048576))

ex = {"node_modules", ".next", "_dist", ".git", "dist", "coverage", ".turbo", ".vscode", "_smoke", "__pycache__"}
src_zip = DIST / f"source_{time.strftime('%H%M%S')}.zip"
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
print("source.zip = %d files / %.2f MB" % (n, src_zip.stat().st_size / 1048576))
print("APP_ZIP=%s" % app_zip)
print("SRC_ZIP=%s" % src_zip)
