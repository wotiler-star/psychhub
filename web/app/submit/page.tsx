import type { Metadata } from 'next';
import { localizedPath, localeAlternates } from '@/i18n/helpers';
import { getLocaleFromHeader } from '@/i18n/server';
import { getDict } from '@/i18n/dictionaries';
import SubmitForm from './SubmitForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  return {
    title: { absolute: t.meta.submit.title },
    description: t.meta.submit.desc,
    ...localeAlternates(locale, '/submit'),
  };
}

export default async function SubmitPage() {
  const locale = await getLocaleFromHeader();
  const t = getDict(locale);
  const lp = (p: string) => localizedPath(p, locale);
  // 仅用于保持 lp 在语义上可用（提交页无内部跳转，但保留以便将来扩展面包屑）
  void lp;
  return <SubmitForm dict={t} />;
}
