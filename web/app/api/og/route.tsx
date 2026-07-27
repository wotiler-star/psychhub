// 动态 SEO 分享卡：GET /api/og?title=...&subtitle=...&tag=...
// 输出 1200x630 PNG（微信/微博/Twitter/飞书等抓取 og:image 时即时渲染）。
// 中文字体：运行时从系统字体目录读取（不入仓库），可用 OG_FONT_PATH / OG_FONT_BOLD_PATH 覆盖。
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';

export const runtime = 'nodejs';
// 卡片内容随查询参数变化，禁止静态化
export const dynamic = 'force-dynamic';

const SITE_NAME = '心理资源聚合';
const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL || 'https://psych-hub.example.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');

// 候选中文字体（satori 仅支持 ttf/otf，不支持 ttc）
const REGULAR_CANDIDATES = [
  process.env.OG_FONT_PATH,
  'C:\\Windows\\Fonts\\Deng.ttf', // 等线
  'C:\\Windows\\Fonts\\simhei.ttf', // 黑体
  '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttf',
  '/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf',
].filter(Boolean) as string[];

const BOLD_CANDIDATES = [
  process.env.OG_FONT_BOLD_PATH,
  'C:\\Windows\\Fonts\\Dengb.ttf',
  'C:\\Windows\\Fonts\\simhei.ttf',
  '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttf',
].filter(Boolean) as string[];

async function loadFirst(paths: string[]): Promise<Buffer | null> {
  for (const p of paths) {
    try {
      return await readFile(p);
    } catch {
      // 尝试下一个候选
    }
  }
  return null;
}

// 模块级缓存：字体只读一次
let fontsPromise: Promise<{ regular: Buffer | null; bold: Buffer | null }> | null = null;
function getFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([loadFirst(REGULAR_CANDIDATES), loadFirst(BOLD_CANDIDATES)]).then(
      ([regular, bold]) => ({ regular, bold: bold ?? regular }),
    );
  }
  return fontsPromise;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || SITE_NAME).slice(0, 60);
  const subtitle = (searchParams.get('subtitle') || '').slice(0, 80);
  const tag = (searchParams.get('tag') || '').slice(0, 12);

  const { regular, bold } = await getFonts();
  const fonts: { name: string; data: Buffer; weight: 400 | 700 }[] = [];
  if (regular) fonts.push({ name: 'cn', data: regular, weight: 400 });
  if (bold) fonts.push({ name: 'cn', data: bold, weight: 700 });

  // 标题按长度自适应字号
  const titleSize = title.length <= 14 ? 72 : title.length <= 24 ? 58 : 46;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #0ea5e9 130%)',
          color: '#ffffff',
          fontFamily: 'cn',
          position: 'relative',
        }}
      >
        {/* 右上装饰圆环 */}
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -140,
            width: 420,
            height: 420,
            borderRadius: 9999,
            border: '48px solid rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 60,
            bottom: -180,
            width: 340,
            height: 340,
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
          }}
        />

        {/* 顶部：品牌 + 标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.92)',
              color: '#4f46e5',
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            心
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 30, fontWeight: 700, display: 'flex' }}>{SITE_NAME}</div>
            <div style={{ fontSize: 19, opacity: 0.75, display: 'flex' }}>
              中文心理学资源导航与科普平台
            </div>
          </div>
          {tag ? (
            <div
              style={{
                display: 'flex',
                marginLeft: 'auto',
                padding: '10px 26px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.35)',
                fontSize: 26,
              }}
            >
              {tag}
            </div>
          ) : null}
        </div>

        {/* 中部：标题 + 副标题 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 980 }}>
          <div
            style={{
              display: 'flex',
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.25,
              letterSpacing: '0.01em',
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ display: 'flex', fontSize: 30, opacity: 0.85, lineHeight: 1.4 }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* 底部：口号 + 域名 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          <div style={{ display: 'flex' }}>3 次点击内，找到你需要的心理资源</div>
          <div style={{ display: 'flex', fontWeight: 700 }}>{SITE_HOST}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length ? fonts : undefined,
      headers: {
        // 分享卡内容由参数决定，可长缓存
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    },
  );
}
