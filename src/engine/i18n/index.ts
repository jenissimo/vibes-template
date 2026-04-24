export { localeStore, i18nService } from './I18nService';

import { i18nService } from './I18nService';

export function loc(key: string): string {
  return i18nService.loc(key);
}

export function locEx(key: string, params: Record<string, string | number>): string {
  return i18nService.locEx(key, params);
}

export type {
  TranslationDictionary,
  SupportedLocale,
  LanguagePreference,
  PluralRule,
  LocaleInfo,
  I18nConfig,
} from './types';
