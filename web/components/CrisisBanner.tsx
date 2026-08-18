// 危机干预条（M4 模块 · P0 合规红线）：全站内建、常驻、可一键跳转求助页
import LocaleLink from '@/components/LocaleLink';
import { Locale } from '@/i18n/config';

export default function CrisisBanner({ locale }: { locale: Locale }) {
  return (
    <div className="crisis-bar" role="region" aria-label="危机求助热线">
      <div
        className="container-page"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          padding: '8px 20px',
          fontSize: 14,
        }}
      >
        <strong style={{ fontWeight: 700 }}>⚠ 处于危机中？</strong>
        <span>如有自伤或伤害他人的念头，请立即联系危机干预热线。</span>
        <LocaleLink
          href="/helplines"
          locale={locale}
          style={{
            marginLeft: 'auto',
            color: 'var(--crisis-text)',
            fontWeight: 700,
            textDecoration: 'underline',
          }}
        >
          查看全国 / 全球求助热线 →
        </LocaleLink>
      </div>
    </div>
  );
}
