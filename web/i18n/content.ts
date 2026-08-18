// 旗舰内容译文层
// 策略（用户确认）：UI + 板块全译；资源/文章/咨询师等实体内容中，
// 精选旗舰条目给真实译文，长尾条目回退中文并标注（common.fallbackNote）。
// key 使用实体的稳定 id / slug。

import { Locale } from './config';

export interface EntityT {
  title?: string;
  description?: string;
  excerpt?: string;
}

type TransMap = Record<string, Partial<Record<Locale, EntityT>>>;

export const contentTranslations: TransMap = {
  // ---------------- 心理测评（公开版权量表，标准译名） ----------------
  'phq-9': {
    en: { title: 'PHQ-9 Depression Screening', description: 'A 9-item self-report scale for depression severity.' },
    ja: { title: 'PHQ-9 うつ病スクリーニング', description: 'うつ症状の重症度を測る9項目の自己記入式尺度。' },
    ko: { title: 'PHQ-9 우울증 선별', description: '우울증 심각도를 측정하는 9문항 자기기입 척도.' },
    es: { title: 'PHQ-9 Tamiz de depresión', description: 'Escala de 9 ítems para la gravedad de la depresión.' },
    fr: { title: 'PHQ-9 Dépistage de la dépression', description: 'Échelle de 9 items sur la sévérité de la dépression.' },
  },
  'gad-7': {
    en: { title: 'GAD-7 Anxiety Screening', description: 'A 7-item scale for generalized anxiety severity.' },
    ja: { title: 'GAD-7 不安スクリーニング', description: '全般性不安の重症度を測る7項目の尺度。' },
    ko: { title: 'GAD-7 불안 선별', description: '광범위 불안 장애 심각도를 측정하는 7문항 척도.' },
    es: { title: 'GAD-7 Tamiz de ansiedad', description: 'Escala de 7 ítems para la ansiedad generalizada.' },
    fr: { title: 'GAD-7 Dépistage de l’anxiété', description: 'Échelle de 7 items sur l’anxiété généralisée.' },
  },
  'who-5': {
    en: { title: 'WHO-5 Well-Being Index', description: 'A 5-item scale measuring subjective psychological well-being.' },
    ja: { title: 'WHO-5 主観的幸福感指標', description: '主観的幸福感を測る5項目の尺度。' },
    ko: { title: 'WHO-5 웰빙 지수', description: '주관적 심리적 웰빙을 측정하는 5문항 척도.' },
    es: { title: 'Índice de bienestar WHO-5', description: 'Escala de 5 ítems sobre bienestar psicológico.' },
    fr: { title: 'Indice de bien-être OMS-5', description: 'Échelle de 5 items sur le bien-être psychologique.' },
  },
  isi: {
    en: { title: 'Insomnia Severity Index (ISI)', description: 'A 7-item scale for insomnia severity.' },
    ja: { title: '不眠重症度指標 (ISI)', description: '不眠の重症度を測る7項目の尺度。' },
    ko: { title: '불면증 심각도 지수 (ISI)', description: '불면증 심각도를 측정하는 7문항 척도.' },
    es: { title: 'Índice de gravedad del insomnio (ISI)', description: 'Escala de 7 ítems sobre el insomnio.' },
    fr: { title: 'Indice de sévérité de l’insomnie (ISI)', description: 'Échelle de 7 items sur l’insomnie.' },
  },
  'pss-10': {
    en: { title: 'Perceived Stress Scale (PSS-10)', description: 'A 10-item scale for perceived stress.' },
    ja: { title: '知覚されたストレス尺度 (PSS-10)', description: '知覚されたストレスを測る10項目の尺度。' },
    ko: { title: '지각된 스트레스 척도 (PSS-10)', description: '지각된 스트레스를 측정하는 10문항 척도.' },
    es: { title: 'Escala de estrés percibido (PSS-10)', description: 'Escala de 10 ítems sobre estrés percibido.' },
    fr: { title: 'Échelle de stress perçu (PSS-10)', description: 'Échelle de 10 items sur le stress perçu.' },
  },
  rses: {
    en: { title: 'Rosenberg Self-Esteem Scale', description: 'A 10-item scale for global self-esteem.' },
    ja: { title: 'ローゼンバーグ自尊感情尺度', description: '全体的な自尊感情を測る10項目の尺度。' },
    ko: { title: '로젠버그 자아존중감 척도', description: '전반적 자아존중감을 측정하는 10문항 척도.' },
    es: { title: 'Escala de autoestima de Rosenberg', description: 'Escala de 10 ítems sobre la autoestima.' },
    fr: { title: 'Échelle d’estime de soi de Rosenberg', description: 'Échelle de 10 items sur l’estime de soi.' },
  },
  sas: {
    en: { title: 'Self-Rating Anxiety Scale (SAS)', description: 'A 20-item Zung scale for anxiety.' },
    ja: { title: '自己評価不安尺度 (SAS)', description: '不安を測るツング式20項目の尺度。' },
    ko: { title: '자기평가불안척도 (SAS)', description: '불안을 측정하는 Zung식 20문항 척도.' },
    es: { title: 'Escala de autoevaluación de ansiedad (SAS)', description: 'Escala de Zung de 20 ítems sobre la ansiedad.' },
    fr: { title: 'Échelle d’auto-évaluation de l’anxiété (SAS)', description: 'Échelle de Zung de 20 items sur l’anxiété.' },
  },
  sds: {
    en: { title: 'Self-Rating Depression Scale (SDS)', description: 'A 20-item Zung scale for depression.' },
    ja: { title: '自己評価うつ尺度 (SDS)', description: 'うつを測るツング式20項目の尺度。' },
    ko: { title: '자기평가우울척도 (SDS)', description: '우울을 측정하는 Zung식 20문항 척도.' },
    es: { title: 'Escala de autoevaluación de depresión (SDS)', description: 'Escala de Zung de 20 ítems sobre la depresión.' },
    fr: { title: 'Échelle d’auto-évaluation de la dépression (SDS)', description: 'Échelle de Zung de 20 items sur la dépression.' },
  },

  // ---------------- 文章（精选） ----------------
  'how-to-find-therapist': {
    en: { title: 'How to Find the Right Therapist' },
    ja: { title: '正しいセラピストの見つけ方' },
    ko: { title: '내게 맞는 상담사 찾는 법' },
    es: { title: 'Cómo encontrar el terapeuta adecuado' },
    fr: { title: 'Comment trouver le bon thérapeute' },
  },
  'anxiety-coping': {
    en: { title: 'Coping with Anxiety' },
    ja: { title: '不安への対処法' },
    ko: { title: '불안 다루기' },
    es: { title: 'Manejo de la ansiedad' },
    fr: { title: 'Gérer l’anxiété' },
  },
  'depression-self-test-guide': {
    en: { title: 'A Guide to Self-Testing for Depression' },
    ja: { title: 'うつ自己チェックガイド' },
    ko: { title: '우울증 자가진단 가이드' },
    es: { title: 'Guía de autoevaluación de la depresión' },
    fr: { title: 'Guide d’auto-évaluation de la dépression' },
  },
  'free-mental-health-resources-china': {
    en: { title: 'Free Mental-Health Resources in China' },
    ja: { title: '中国の無料心の資源' },
    ko: { title: '중국의 무료 마음 자원' },
    es: { title: 'Recursos gratuitos de salud mental en China' },
    fr: { title: 'Ressources gratuites de santé mentale en Chine' },
  },
  'psychology-of-social-media': {
    en: { title: 'The Psychology of Social Media' },
    ja: { title: 'ソーシャルメディアの心理学' },
    ko: { title: '소셜 미디어의 심리학' },
    es: { title: 'La psicología de las redes sociales' },
    fr: { title: 'La psychologie des réseaux sociaux' },
  },
  'sleep-and-mental-health': {
    en: { title: 'Sleep and Mental Health' },
    ja: { title: '睡眠と心の健康' },
    ko: { title: '수면과 마음 건강' },
    es: { title: 'Sueño y salud mental' },
    fr: { title: 'Sommeil et santé mentale' },
  },
  'understanding-burnout': {
    en: { title: 'Understanding Burnout' },
    ja: { title: 'バーンアウトを理解する' },
    ko: { title: '번아웃 이해하기' },
    es: { title: 'Entender el agotamiento' },
    fr: { title: 'Comprendre l’épuisement professionnel' },
  },
  'what-is-psychology': {
    en: { title: 'What Is Psychology?' },
    ja: { title: '心理学とは？' },
    ko: { title: '심리학이란?' },
    es: { title: '¿Qué es la psicología?' },
    fr: { title: 'Qu’est-ce que la psychologie ?' },
  },
};

// 资源类型标签译文（RESOURCE_TYPE_META.label 的中文对应；用于子版块落地页 H1 / 面包屑）
// key 与 lib/format.ts 的 RESOURCE_TYPE_META 一致（大写常量）
export const resourceTypeTranslations: Record<
  string,
  Partial<Record<Locale, string>>
> = {
  MEDIA: {
    en: 'Media & Content',
    ja: 'メディア・コンテンツ',
    ko: '미디어·콘텐츠',
    es: 'Medios y contenido',
    fr: 'Médias et contenu',
  },
  SAAS: {
    en: 'Practice SaaS',
    ja: '開業 SaaS',
    ko: '개업 SaaS',
    es: 'SaaS para profesionales',
    fr: 'SaaS pour professionnels',
  },
  THERAPY: {
    en: 'Online Therapy',
    ja: 'オンラインカウンセリング',
    ko: '온라인 상담',
    es: 'Terapia en línea',
    fr: 'Thérapie en ligne',
  },
  ORG: {
    en: 'Nonprofits',
    ja: 'NPO・公益',
    ko: '비영리 단체',
    es: 'Organizaciones sin fines de lucro',
    fr: 'Organisations à but non lucratif',
  },
  TOOL: {
    en: 'Assessment Tools',
    ja: 'チェックツール',
    ko: '진단 도구',
    es: 'Herramientas de evaluación',
    fr: 'Outils d’évaluation',
  },
  MEDITATION: {
    en: 'Meditation & Self-help',
    ja: '瞑想・セルフケア',
    ko: '명상·셀프케어',
    es: 'Meditación y autocuidado',
    fr: 'Méditation et autosoins',
  },
  EDU: {
    en: 'Education & Research',
    ja: '学術・教育',
    ko: '학술·교육',
    es: 'Educación e investigación',
    fr: 'Éducation et recherche',
  },
};

/** 资源类型标签：zh 用中文原值，其余语言取译文（无译文回退中文 label） */
export function tResourceType(type: string, locale: Locale, fallbackZh?: string): string {
  if (locale === 'zh') return fallbackZh ?? type;
  return resourceTypeTranslations[type]?.[locale] ?? fallbackZh ?? type;
}

export interface TranslatedEntity {
  title: string;
  description: string;
  fallback: boolean;
  locale: Locale;
}

/** 取实体译文；无译文则回退中文原文（fallback=true，UI 可据此标注） */
export function tEntity(
  key: string,
  base: { title: string; description?: string; excerpt?: string },
  locale: Locale,
): TranslatedEntity {
  if (locale === 'zh') {
    return {
      title: base.title,
      description: base.description ?? base.excerpt ?? '',
      fallback: false,
      locale,
    };
  }
  const t = contentTranslations[key]?.[locale];
  if (t) {
    return {
      title: t.title ?? base.title,
      description: t.description ?? t.excerpt ?? base.description ?? base.excerpt ?? '',
      fallback: false,
      locale,
    };
  }
  return {
    title: base.title,
    description: base.description ?? base.excerpt ?? '',
    fallback: true,
    locale,
  };
}
