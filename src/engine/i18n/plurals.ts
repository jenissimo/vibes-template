import type { PluralRule } from './types';

// 2 forms: singular, plural (most Western European languages)
const twoForm: PluralRule = (n: number) => (n === 1 ? 0 : 1);

const pluralRules: Record<string, PluralRule> = {
  // Germanic / Romance: 2 forms (one, other)
  en: twoForm,
  fr: (n: number) => (n === 0 || n === 1 ? 0 : 1),
  de: twoForm,
  es: twoForm,
  it: twoForm,
  pt: twoForm,
  tr: twoForm,

  // Slavic: 3 forms (one, few, many)
  ru: (n: number) => {
    const abs = Math.abs(n);
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 === 1 && mod100 !== 11) return 0;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 1;
    return 2;
  },
  pl: (n: number) => {
    if (n === 1) return 0;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1;
    return 2;
  },
};

export function getPluralForm(locale: string, count: number): number {
  const rule = pluralRules[locale] ?? pluralRules['en'];
  return rule(count);
}
