'use client';

import { useState } from 'react';
import { saveReferral } from '@/lib/referral';

interface Props {
  counselorId: string;
  counselorName: string;
  bookingUrl: string;
  utmSource?: string;
}

// 给转介外链追加 UTM 归因参数（便于合作方识别来自本平台的转介）。
function withUtm(url: string, source: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('ref', source);
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', 'referral');
    return u.toString();
  } catch {
    return url;
  }
}

export default function ReferralButton({
  counselorId,
  counselorName,
  bookingUrl,
  utmSource = 'psychhub',
}: Props) {
  const [recorded, setRecorded] = useState(false);
  const url = withUtm(bookingUrl, utmSource);

  function handleClick() {
    saveReferral({ counselorId, counselorName, bookingUrl: url });
    setRecorded(true);
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <a
        className="btn-primary"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
      >
        前往预约 ↗
      </a>
      {recorded && (
        <span style={{ color: 'var(--alert-success-ink)', fontSize: 13, fontWeight: 600 }}>
          ✓ 已记录你的转介
        </span>
      )}
    </span>
  );
}
