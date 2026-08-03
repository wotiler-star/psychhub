'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useMembership } from '@/lib/membership';
import { getReviews, getMySubmissions, type Submission } from '@/lib/api';
import type { Review } from '@/lib/types';
import AssessmentHistory from '@/components/AssessmentHistory';
import MembershipCard from '@/components/MembershipCard';
import PointsPanel from '@/components/PointsPanel';
import SavedList from '@/components/SavedList';

const TABS = [
  { key: 'profile', label: '资料' },
  { key: 'reviews', label: '我的评价' },
  { key: 'saved', label: '我的收藏' },
  { key: 'points', label: '积分成长' },
  { key: 'subs', label: '我的订阅' },
];

const SUBMISSION_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: '待审核', bg: 'var(--chip-bg)', fg: 'var(--brand)' },
  approved: { label: '已收录', bg: 'var(--alert-success-bg)', fg: 'var(--alert-success-ink)' },
  rejected: { label: '未通过', bg: 'var(--alert-danger-bg)', fg: 'var(--alert-danger-ink)' },
};

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export default function AccountPage() {
  const { user, logout, loading } = useAuth();
  const { state, tier, isExpired } = useMembership();
  const [tab, setTab] = useState('profile');
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);

  useEffect(() => {
    if (!user) {
      setReviews(null);
      setSubmissions(null);
      return;
    }
    let alive = true;
    getReviews(user.id)
      .then((r) => alive && setReviews(r))
      .catch(() => alive && setReviews([]));
    getMySubmissions(user.email)
      .then((s) => alive && setSubmissions(s))
      .catch(() => alive && setSubmissions([]));
    return () => {
      alive = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="container-page" style={{ padding: '40px 20px' }}>
        加载中…
      </div>
    );
  }

  return (
    <div className="container-page" style={{ padding: '32px 20px 56px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>我的账号</h1>
        {user ? (
          <button
            onClick={() => logout()}
            className="chip"
            style={{ cursor: 'pointer', border: '1px solid var(--line)', background: 'var(--card)', minHeight: 40, padding: '0 16px' }}
          >
            退出登录
          </button>
        ) : (
          <Link className="btn-primary" href="/login" style={{ fontSize: 14 }}>
            登录 / 注册
          </Link>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <MembershipCard />
      </div>

      {!user && (
        <div
          style={{
            marginTop: 14,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'var(--chip-sky-bg)',
            color: '#0284c7',
            fontSize: 14,
          }}
        >
          登录后，你的评价、收录提交与收藏将同步到账号；会员成长与签到本地保存，登录后自动绑定当前账号。
        </div>
      )}

      {/* Tab 导航 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '24px 0 18px' }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="chip"
              aria-pressed={active}
              style={{
                background: active ? 'var(--brand)' : 'var(--surface-2)',
                color: active ? 'var(--btn-text)' : 'var(--muted)',
                cursor: 'pointer',
                border: '1px solid transparent',
                fontFamily: 'inherit',
                fontSize: 14,
                padding: '8px 16px',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profile' && (
        <ProfileTab user={user} profile={state.profile} />
      )}

      {tab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!user ? (
            <EmptyHint text="登录后可查看你发表的评价格式。" />
          ) : reviews && reviews.length > 0 ? (
            reviews.map((r) => (
              <div className="card" key={r.id} style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--warn)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <Link href={`/counselors/${r.counselorId}`} style={{ fontSize: 14 }}>
                    {r.counselorName ?? '咨询师'} →
                  </Link>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 15 }}>{r.content}</p>
              </div>
            ))
          ) : (
            <EmptyHint text="你还没有发表过评价。" cta={{ href: '/counselors', label: '去找一位咨询师评价' }} />
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div style={{ marginTop: -16 }}>
          <SavedList />
        </div>
      )}

      {tab === 'points' && <PointsPanel />}

      {tab === 'subs' && (
        <SubscriptionTab user={user} tierName={tier.name} subscribedAt={state.subscribedAt} expiresAt={state.expiresAt} isExpired={isExpired} />
      )}
    </div>
  );
}

function ProfileTab({
  user,
  profile,
}: {
  user: { name: string; email: string } | null;
  profile: { name: string; bio: string };
}) {
  const { updateProfile } = useMembership();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setBio(profile.bio);
  }, [profile.name, profile.bio]);

  function save() {
    updateProfile({ name, bio });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 17, margin: '0 0 14px' }}>个人资料</h3>
        <label style={labelStyle}>
          昵称
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={user?.name ?? '心理探索者'}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          个性签名
          <input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="一句话介绍自己" style={inputStyle} />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <button type="button" onClick={save} className="btn-primary" style={{ fontSize: 14 }}>
            保存资料
          </button>
          {saved && <span style={{ color: 'var(--safe)', fontSize: 13 }}>已保存（本地）</span>}
        </div>
        {user && (
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '12px 0 0' }}>
            登录邮箱：{user.email}（账户信息由登录系统管理）
          </p>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 17, margin: '0 0 10px' }}>安全设置</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          演示环境暂不支持在线修改密码。正式上线后可在「账号安全」中设置新密码、两步验证与登录设备。
        </p>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 17, margin: '0 0 10px' }}>我的测评历史</h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 12px' }}>测评记录保存在你的浏览器本地，无需登录即可回看。</p>
        <AssessmentHistory />
      </div>
    </div>
  );
}

function SubscriptionTab({
  user,
  tierName,
  subscribedAt,
  expiresAt,
  isExpired,
}: {
  user: { name: string; email: string } | null;
  tierName: string;
  subscribedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}) {
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('zh-CN') : '—');
  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 17, margin: '0 0 14px' }}>我的订阅</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
        <Row label="当前会员" value={tierName} />
        <Row label="开通时间" value={fmt(subscribedAt)} />
        <Row
          label="有效期至"
          value={expiresAt ? `${fmt(expiresAt)}${isExpired ? '（已过期）' : ''}` : '永久免费'}
          danger={isExpired}
        />
      </div>
      {(!user || expiresAt === null || isExpired) && (
        <Link className="btn-primary" href="/membership" style={{ fontSize: 14, marginTop: 16 }}>
          {expiresAt && !isExpired ? '管理订阅' : '升级 / 开通会员'}
        </Link>
      )}
      {user && expiresAt && !isExpired && (
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '14px 0 0' }}>
          你的会员权益正在生效。如需变更套餐，请前往会员中心。
        </p>
      )}
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: danger ? 'var(--alert-danger-ink)' : 'var(--ink)' }}>{value}</span>
    </div>
  );
}

function EmptyHint({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 36 }}>
      <p style={{ margin: '0 0 14px', fontSize: 14 }}>{text}</p>
      {cta && (
        <Link className="btn-primary" href={cta.href} style={{ fontSize: 14 }}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 14, color: 'var(--muted)', marginBottom: 14 };
const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  minHeight: 42,
  marginTop: 6,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--input-bg)',
  color: 'var(--ink)',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
};
