// 前后端共享类型（与 backend OpenAPI 契约 / Prisma 模型对齐）

export type ResourceType =
  | 'MEDIA'
  | 'SAAS'
  | 'THERAPY'
  | 'ORG'
  | 'TOOL'
  | 'MEDITATION'
  | 'EDU';

export interface Resource {
  id: string;
  name: string;
  url: string;
  type: ResourceType;
  country: string | null;
  language: string | null;
  description: string | null;
  trafficLevel: string | null;
  suitableFor: string | null;
  tags: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HelplineCategory = 'CRISIS' | 'SUPPORT' | 'LOW_COST';

export interface Helpline {
  id: string;
  name: string;
  country: string;
  language: string;
  phone: string | null;
  url: string | null;
  description: string | null;
  category: HelplineCategory | null;
}

export interface AssessmentOption {
  score: number;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: AssessmentOption[];
  reverse?: boolean; // 反向计分题：实际得分 = (档位数-1) - 原得分（当前档位为 0-3）
}

export interface AssessmentBand {
  max: number;
  level: string;
  advice: string;
}

export interface Assessment {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string | null;
  questions: AssessmentQuestion[];
  interpretation: { bands: AssessmentBand[] } | null;
  source: string | null;
  createdAt: string;
}

export type ArticleCategory = 'POPSCI' | 'RESEARCH' | 'NEWS';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: ArticleCategory | null;
  tags: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  author: string | null;
  coverImage: string | null;
  publishedAt: string;
  createdAt: string;
}

export interface Counselor {
  id: string;
  name: string;
  title: string | null;
  specialties: string[];
  approach: string[];
  region: string | null;
  remote: boolean;
  languages: string[];
  pricePerSession: number | null;
  currency: string;
  org: string | null;
  bio: string | null;
  avatar: string | null;
  bookingUrl: string | null;
  rating: number | null;
  yearsExperience: number | null;
  tags: string[];
  featured: boolean;
}

export interface Review {
  id: string;
  counselorId: string;
  authorName: string;
  authorId: string | null;
  rating: number; // 1-5
  content: string;
  counselorName?: string; // 社区流返回时附带
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}
