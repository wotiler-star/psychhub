import Link from 'next/link';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';

interface Props {
  /** 当前激活的子版块类型（小写，如 'media'）；不传则无高亮 */
  active?: string;
}

// 资源导航的 7 个子版块快捷导航：链接到 /resources/<type> 独立落地页
export default function ResourceSubNav({ active }: Props) {
  const activeUp = active?.toUpperCase();
  return (
    <nav
      aria-label="资源子版块"
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 20px' }}
    >
      {RESOURCE_TYPES.map((t) => {
        const meta = RESOURCE_TYPE_META[t];
        const isActive = activeUp === t;
        return (
          <Link
            key={t}
            href={`/resources/${t.toLowerCase()}`}
            className={`chip ${meta.chip}`}
            style={{
              textDecoration: 'none',
              fontWeight: isActive ? 700 : 500,
              border: isActive ? '1px solid var(--brand)' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 0 var(--brand)' : 'none',
            }}
          >
            <span style={{ marginRight: 4 }}>{meta.emoji}</span>
            {meta.label}
          </Link>
        );
      })}
    </nav>
  );
}
