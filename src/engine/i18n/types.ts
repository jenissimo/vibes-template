export type TranslationDictionary = Record<string, string>;

export type SupportedLocale = 'en' | 'ru' | 'fr' | 'de' | 'es' | 'it' | 'pt' | 'tr' | 'pl';

export type LanguagePreference = 'system' | SupportedLocale;

export type PluralRule = (count: number) => number;

export interface LocaleInfo {
  code: string;
  endonym: string;
  isDevOnly?: boolean;
}

export interface I18nConfig {
  fallbackLocale: string;
  translationModules: Record<string, unknown>;
  savedPreference?: LanguagePreference;
}
