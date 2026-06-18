import 'server-only';

export type Locale = 'en' | 'th';

export const locales: Locale[] = ['en', 'th'];
export const defaultLocale: Locale = 'en';

export const getDictionary = async (locale: string) => {
  const normalizedLocale = (locale === 'th' ? 'th' : 'en') as Locale;
  return import(`../messages/${normalizedLocale}/common.json`).then((module) => module.default);
};

export const getModuleDictionary = async (locale: string, moduleId: string) => {
  const normalizedLocale = (locale === 'th' ? 'th' : 'en') as Locale;
  try {
    return await import(`../messages/${normalizedLocale}/modules/${moduleId}.json`).then((module) => module.default);
  } catch {
    return {};
  }
};

