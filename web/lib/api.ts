import type { Resource, Helpline, Assessment, Article, Counselor, Review, AuthUser } from './types';

// API 基地址解析：
// - 浏览器端：使用相对路径 /api，由 next.config 的 rewrites 代理到后端（规避 CORS）
// - 服务端（SSR）：必须绝对地址，默认 http://localhost:3001，可用 NEXT_PUBLIC_API_BASE 覆盖
const isServer = typeof window === 'undefined';
function apiBase(): string {
  if (!isServer) return '';
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    // SSR 场景每次请求实时取数；避免构建期缓存
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API ${path} 失败：${res.status}`);
  }
  return (await res.json()) as T;
}

export interface ResourceQuery {
  q?: string;
  type?: string;
  country?: string;
  language?: string;
  tag?: string;
}

export function getResources(query: ResourceQuery = {}): Promise<Resource[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return getJson<Resource[]>(`/api/resources${qs ? `?${qs}` : ''}`);
}

export function getFeaturedResources(): Promise<Resource[]> {
  return getJson<Resource[]>('/api/resources/featured');
}

export function getResource(id: string): Promise<Resource> {
  return getJson<Resource>(`/api/resources/${id}`);
}

export interface HelplineQuery {
  country?: string;
  language?: string;
  category?: string;
  q?: string;
}

export function getHelplines(query: HelplineQuery = {}): Promise<Helpline[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return getJson<Helpline[]>(`/api/helplines${qs ? `?${qs}` : ''}`);
}

export interface AssessmentQuery {
  q?: string;
  type?: string;
}

export function getAssessments(query: AssessmentQuery = {}): Promise<Assessment[]> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.type) params.set('type', query.type);
  const qs = params.toString();
  return getJson<Assessment[]>(`/api/assessments${qs ? `?${qs}` : ''}`);
}

export function getAssessment(slug: string): Promise<Assessment> {
  return getJson<Assessment>(`/api/assessments/${slug}`);
}

export interface ArticleQuery {
  category?: string;
  q?: string;
}

export function getArticles(query: ArticleQuery = {}): Promise<Article[]> {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.q) params.set('q', query.q);
  const qs = params.toString();
  return getJson<Article[]>(`/api/articles${qs ? `?${qs}` : ''}`);
}

export function getArticle(slug: string): Promise<Article> {
  return getJson<Article>(`/api/articles/${slug}`);
}

export interface CounselorQuery {
  specialty?: string;
  region?: string;
  maxPrice?: number;
  remote?: boolean;
  q?: string;
}

export function getCounselors(query: CounselorQuery = {}): Promise<Counselor[]> {
  const params = new URLSearchParams();
  if (query.specialty) params.set('specialty', query.specialty);
  if (query.region) params.set('region', query.region);
  if (query.maxPrice != null) params.set('maxPrice', String(query.maxPrice));
  if (query.remote) params.set('remote', '1');
  if (query.q) params.set('q', query.q);
  const qs = params.toString();
  return getJson<Counselor[]>(`/api/counselors${qs ? `?${qs}` : ''}`);
}

export function getCounselor(id: string): Promise<Counselor> {
  return getJson<Counselor>(`/api/counselors/${id}`);
}

// === 咨询师评价 / 社区 ===
export function getCounselorReviews(id: string): Promise<Review[]> {
  return getJson<Review[]>(`/api/counselors/${id}/reviews`);
}

export function getReviews(authorId?: string): Promise<Review[]> {
  const qs = authorId ? `?authorId=${encodeURIComponent(authorId)}` : '';
  return getJson<Review[]>(`/api/reviews${qs}`);
}

export async function postReview(input: {
  counselorId: string;
  rating: number;
  content: string;
}): Promise<{ review: Review }> {
  const res = await fetch(`${apiBase()}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = `提交失败：${res.status}`;
    try {
      const e = await res.json();
      if (e && e.error) msg = e.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as { review: Review };
}

// === 认证（演示：本地预览服务为内存会话；生产由 NestJS + Auth 提供）===
export async function getMe(): Promise<AuthUser | null> {
  try {
    const d = await getJson<{ user: AuthUser | null }>('/api/auth/me');
    return d.user;
  } catch {
    return null;
  }
}

export async function login(input: {
  email: string;
  name?: string;
  password?: string;
}): Promise<AuthUser> {
  const res = await fetch(`${apiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('登录失败');
  const d = await res.json();
  return d.user as AuthUser;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch(`${apiBase()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('注册失败');
  const d = await res.json();
  return d.user as AuthUser;
}

export async function logout(): Promise<void> {
  await fetch(`${apiBase()}/api/auth/logout`, { method: 'POST', cache: 'no-store' });
}

// === 站点收录提交（UGC）===
export interface SubmissionInput {
  kind: 'resource' | 'counselor';
  name: string;
  url: string;
  type?: string;
  specialty?: string;
  description?: string;
  tags?: string;
  country?: string;
  submitterEmail?: string;
}

export interface Submission {
  id: string;
  kind: 'resource' | 'counselor';
  name: string;
  url: string;
  type: string;
  specialty: string;
  description: string;
  tags: string[];
  country: string;
  submitterEmail: string;
  status: string;
  submittedAt: string;
}

export function getSubmissions(): Promise<Submission[]> {
  return getJson<Submission[]>('/api/submissions');
}

// 我的收录提交：按当前登录邮箱返回「我」提交的站点/咨询师（?mine=1 由后端按 sessionUser 或 email 匹配）
export function getMySubmissions(email?: string): Promise<Submission[]> {
  const qs = email ? `?mine=1&email=${encodeURIComponent(email)}` : '?mine=1';
  return getJson<Submission[]>(`/api/submissions${qs}`);
}

export async function submitResource(input: SubmissionInput): Promise<{ submission: Submission }> {
  const res = await fetch(`${apiBase()}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = `提交失败：${res.status}`;
    try {
      const e = await res.json();
      if (e && e.error) msg = e.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as { submission: Submission };
}
