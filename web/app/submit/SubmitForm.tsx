'use client';

import { useEffect, useState } from 'react';
import { RESOURCE_TYPES, RESOURCE_TYPE_META } from '@/lib/format';
import { getSubmissions, submitResource } from '@/lib/api';
import type { Submission, SubmissionInput } from '@/lib/api';
import type { Dict } from '@/i18n/dictionaries';

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

export default function SubmitForm({ dict }: { dict: Dict }) {
  const p = dict.pages;
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
    if (name.trim().length < 2) e.name = p.submitErrName;
    if (!/^https?:\/\/.+/.test(url.trim())) e.url = p.submitErrUrl;
    if (description.trim() && description.trim().length < 5) e.description = p.submitErrDesc;
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = p.submitErrEmail;
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
      setSuccess(p.submitSuccess.replace('{name}', submission.name));
      setName('');
      setUrl('');
      setDescription('');
      setTags('');
      setCountry('');
      setEmail('');
      setErrors({});
      await refreshList();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : p.submitErrForm });
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
      <h1 style={{ fontSize: 28, margin: '0 0 6px' }}>{dict.sections.submit}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 20px', lineHeight: 1.7, maxWidth: 680 }}>
        {p.submitSubtitle}
      </p>

      {/* 类型切换 */}
      <div style={{ display: 'inline-flex', gap: 8, marginBottom: 20 }}>
        <button type="button" onClick={() => setKind('resource')} style={kindBtn(kind === 'resource')}>
          {p.submitKindResource}
        </button>
        <button type="button" onClick={() => setKind('counselor')} style={kindBtn(kind === 'counselor')}>
          {p.submitKindCounselor}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'grid', gap: 18 }}>
        <div>
          <label style={labelStyle}>{p.submitName}</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={p.submitNamePh}
          />
          {errors.name && <div style={errStyle}>{errors.name}</div>}
        </div>

        <div>
          <label style={labelStyle}>{p.submitUrl}</label>
          <input
            style={inputStyle}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={p.submitUrlPh}
          />
          {errors.url && <div style={errStyle}>{errors.url}</div>}
        </div>

        {kind === 'resource' ? (
          <div>
            <label style={labelStyle}>{p.submitType}</label>
            <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">{p.submitTypePh}</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RESOURCE_TYPE_META[t].label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>{p.submitSpecialty}</label>
            <input
              style={inputStyle}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder={p.submitSpecialtyPh}
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>{p.submitDesc}</label>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={p.submitDescPh}
          />
          {errors.description && <div style={errStyle}>{errors.description}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>{p.submitTags}</label>
            <input
              style={inputStyle}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={p.submitTagsPh}
            />
          </div>
          <div>
            <label style={labelStyle}>{p.submitCountry}</label>
            <input
              style={inputStyle}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={p.submitCountryPh}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{p.submitEmail}</label>
          <input
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={p.submitEmailPh}
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
            {submitting ? p.submitSubmitting : p.submitBtn}
          </button>
        </div>
      </form>

      {/* 待审核列表 */}
      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 20, margin: '0 0 4px' }}>{p.submitPendingTitle}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 16px' }}>
          {loadingList ? p.submitSubmitting : p.submitPendingCount.replace('{n}', String(list.length))}
        </p>
        {!loadingList && list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
            {p.submitEmptyTitle}
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
                  {s.kind === 'resource' ? p.submitKindResourceChip : p.submitKindCounselorChip}
                </span>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                      {s.name} ↗
                    </a>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
                    {s.kind === 'resource' && s.type ? `${p.submitType}：${RESOURCE_TYPE_META[s.type as keyof typeof RESOURCE_TYPE_META]?.label ?? s.type}　` : ''}
                    {s.kind === 'counselor' && s.specialty ? `${p.submitSpecialty}：${s.specialty}　` : ''}
                    {s.country ? `${p.submitCountry}：${s.country}　` : ''}
                    {s.description ? `${p.submitDesc}：${s.description}` : ''}
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
                    {p.submitPendingChip}
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
