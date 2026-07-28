import type { Metadata } from 'next';

export interface PaginateResult<T> {
  pageItems: T[];
  page: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function paginate<T>(items: T[], page: number, size: number): PaginateResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (p - 1) * size;
  return {
    pageItems: items.slice(start, start + size),
    page: p,
    totalPages,
    total,
    hasPrev: p > 1,
    hasNext: p < totalPages,
  };
}

/** 构造带 page 参数的同页 URL（保留其它筛选条件） */
export function buildPageUrl(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && k !== 'page') sp.set(k, v);
  });
  sp.set('page', String(page));
  return `${basePath}?${sp.toString()}`;
}

/** 为 generateMetadata 追加分页 prev/next（相对 URL，由 metadataBase 绝对化） */
export function withPagination(
  meta: Metadata,
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
  totalItems: number,
  size: number,
): Metadata {
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  const pagination: { prev?: string; next?: string } = {};
  if (page > 1) pagination.prev = buildPageUrl(basePath, params, page - 1);
  if (page < totalPages) pagination.next = buildPageUrl(basePath, params, page + 1);
  return {
    ...meta,
    pagination: Object.keys(pagination).length ? pagination : undefined,
  };
}
