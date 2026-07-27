'use client';

import { useEffect, useState } from 'react';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';
import { getSubmissions, submitResource } from '@/lib/api';
import type { Submission, SubmissionInput } from '@/lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--card)',
  color: 'var(--ink)',
  fontSize: 14,
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--ink)',
};
const errStyle: React.CSSProperties = { color: '#e5484d', fontSize: 13, marginTop: 4 };

export default function SubmitPage() {
  const [kind, setKind] = useState<'resource' | 'counselor'>('resource');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [list, setList] = useState<Submission[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  async function refreshList() {
    setLoadingList(true);
    try {
      setList(await getSubmissions());
    } catch {
      /* 忽略：演示态 */
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = '名称至少 2 个字';
    if (!/^https?:\/\/.+/.test(url.trim())) e.url = '请输入有效的网址（以 http:// 或 https:// 开头）';
    if (description.trim() && description.trim().length < 5) e.description = '描述至少 5 个字（或留空）';
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = '邮箱格式不正确';
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSuccess(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const input: SubmissionInput = {
      kind,
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      tags: tags.trim(),
      country: country.trim(),
      submitterEmail: email.trim(),
    };
    if (kind === 'resource') input.type = type;
    else input.specialty = specialty.trim();

    setSubmitting(true);
    try {
      const { submission } = await submitResource(input);
      setSuccess(`已收到「${submission.name}」的收录申请，状态：待审核 ✅`);
      // 清空可重复填写的字段，保留类型选择
      setName('');
      setUrl('');
      setDescription('');
      setTags('');
      setCountry('');
      setEmail('');
      setErrors({});
      await refreshList();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : '提交失败，请稍后再试' });
    } finally {
      setSubmitting(false);
    }
  }

  const kindBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    borderRadius: 8,
    border: active ? 'none' : '1px solid var(--brand)',
    background: active ? 'var(--brand)' : 'transparent',
    color: active ? 'var(--btn-text)' : 'var(--brand)',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
  });

  return (
    <div className="container-page" style={{ padding: '32px 20px 48px', maxWidth: 880, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>提交收录</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 20px', lineHeight: 1.7, maxWidth: 680 }}>
        发现了一个优质的心理学网站或心理咨询师？提交给我们，审核通过后将收录进站点资源库，帮助更多人。
        提交后进入「待审核」队列；演示环境数据保存在内存中，重启后重置。
      </p>

      {/* 类型切换 */}
      <div style={{ display: 'inline-flex', gap: 8, marginBottom: 20 }}>
        <button type="button" onClick={() => setKind('resource')} style={kindBtn(kind === 'resource')}>
          收录资源
        </button>
        <button type="button" onClick={() => setKind('counselor')} style={kindBtn(kind === 'counselor')}>
          收录咨询师
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'grid', gap: 18 }}>
        <div>
          <label style={labelStyle}>名称 *</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'resource' ? '如 Psychology Today' : '如 张医生（国家二级咨询师）'}
          />
          {errors.name && <div style={errStyle}>{errors.name}</div>}
        </div>

        <div>
          <label style={labelStyle}>网址 *</label>
          <input
            style={inputStyle}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          {errors.url && <div style={errStyle}>{errors.url}</div>}
        </div>

        {kind === 'resource' ? (
          <div>
            <label style={labelStyle}>资源类型</label>
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">请选择类型（可留空）</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RESOURCE_TYPE_META[t].label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>擅长议题</label>
            <input
              style={inputStyle}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="如 焦虑、抑郁、亲密关系（逗号分隔）"
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>一句话描述</label>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="用一句话说明这个资源/咨询师的价值（≥5 字，留空也可）"
          />
          {errors.description && <div style={errStyle}>{errors.description}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>标签（逗号分隔）</label>
            <input
              style={inputStyle}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="如 科普, 权威, 免费"
            />
          </div>
          <div>
            <label style={labelStyle}>国家 / 地区</label>
            <input
              style={inputStyle}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="如 美国 / 中国"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>提交人邮箱（选填，用于审核反馈）</label>
          <input
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          {errors.email && <div style={errStyle}>{errors.email}</div>}
        </div>

        {errors.form && (
          <div className="card" style={{ background: 'var(--alert-danger-bg)', border: '1px solid var(--alert-danger-line)', color: 'var(--alert-danger-ink)', padding: 12 }}>
            {errors.form}
          </div>
        )}
        {success && (
          <div className="card" style={{ background: 'var(--alert-success-bg)', border: '1px solid var(--alert-success-line)', color: 'var(--alert-success-ink)', padding: 12 }}>
            {success}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ opacity: submitting ? 0.6 : 1, fontSize: 16, padding: '10px 24px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? '提交中…' : '提交收录'}
          </button>
        </div>
      </form>

      {/* 待审核列表 */}
      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 4px' }}>待审核收录</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 16px' }}>
          {loadingList ? '加载中…' : `共 ${list.length} 条（演示态，重启后清空）`}
        </p>
        {!loadingList && list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
            还没有收录申请，提交上面的表单试试 👆
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {list.map((s) => (
              <div key={s.id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span
                  className="chip"
                  style={{
                    background: s.kind === 'resource' ? 'var(--chip-sky-bg, #e6f4ff)' : 'var(--chip-purple-bg)',
                    color: s.kind === 'resource' ? '#1677ff' : '#722ed1',
                    fontWeight: 700,
                  }}
                >
                  {s.kind === 'resource' ? '资源' : '咨询师'}
                </span>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                      {s.name} ↗
                    </a>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
                    {s.kind === 'resource' && s.type ? `类型：${RESOURCE_TYPE_META[s.type as keyof typeof RESOURCE_TYPE_META]?.label ?? s.type}　` : ''}
                    {s.kind === 'counselor' && s.specialty ? `议题：${s.specialty}　` : ''}
                    {s.country ? `地区：${s.country}　` : ''}
                    {s.description ? `描述：${s.description}` : ''}
                  </div>
                  {s.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {s.tags.map((t) => (
                        <span key={t} className="chip" style={{ fontSize: 12 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  <div
                    className="chip"
                    style={{ background: 'var(--surface-2)', color: '#d46b08', fontWeight: 700, display: 'inline-block' }}
                  >
                    待审核
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
                    {new Date(s.submittedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
