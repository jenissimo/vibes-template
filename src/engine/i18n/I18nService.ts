import { atom } from 'nanostores';
import { logger } from '@/engine/logging';
import { eventBus } from '@/engine/events/EventBus';
import { getPluralForm } from './plurals';
import { generatePseudoDictionary } from './pseudoLocale';
import type {
  TranslationDictionary,
  LanguagePreference,
  LocaleInfo,
  I18nConfig,
} from './types';

export const localeStore = atom<string>('en');

const LOCALE_REGISTRY: LocaleInfo[] = [
  { code: 'en', endonym: 'English' },
  { code: 'fr', endonym: 'Français' },
  { code: 'de', endonym: 'Deutsch' },
  { code: 'es', endonym: 'Español' },
  { code: 'it', endonym: 'Italiano' },
  { code: 'pt', endonym: 'Português' },
  { code: 'ru', endonym: 'Русский' },
  { code: 'tr', endonym: 'Türkçe' },
  { code: 'pl', endonym: 'Polski' },
  { code: 'xx-long', endonym: 'Pseudo (overflow test)', isDevOnly: true },
];

const TOKEN_RE = /\[([^\]]+)\]/g;

class I18nService {
  private resolvedLocale = 'en';
  private preference: LanguagePreference = 'system';
  private dictionaries = new Map<string, TranslationDictionary>();
  private readonly fallbackLocale = 'en';
  private readonly warnedKeys = new Set<string>();

  initialize(config: I18nConfig): void {
    this.dictionaries.clear();
    this.warnedKeys.clear();

    for (const [path, mod] of Object.entries(config.translationModules)) {
      const match = path.match(/\/([^/]+)\.json$/);
      if (!match) continue;
      const code = match[1];
      const dict = (mod as { default?: TranslationDictionary }).default ?? (mod as TranslationDictionary);
      this.dictionaries.set(code, dict);
    }

    if (import.meta.env.DEV) {
      const enDict = this.dictionaries.get('en');
      if (enDict) {
        this.dictionaries.set('xx-long', generatePseudoDictionary(enDict));
      }
    }

    this.preference = config.savedPreference ?? 'system';
    this.resolvedLocale = this.resolveLocale();
    localeStore.set(this.resolvedLocale);
  }

  setPreference(pref: LanguagePreference): void {
    this.preference = pref;
    this.resolvedLocale = this.resolveLocale();
    localeStore.set(this.resolvedLocale);
    eventBus.emit('locale-changed', { locale: this.resolvedLocale });
  }

  loc(key: string): string {
    const dict = this.dictionaries.get(this.resolvedLocale);
    if (dict && key in dict) return dict[key];

    const fallback = this.dictionaries.get(this.fallbackLocale);
    if (fallback && key in fallback) return fallback[key];

    if (!this.warnedKeys.has(key)) {
      this.warnedKeys.add(key);
      logger.warn(`i18n: missing key "${key}" for locale "${this.resolvedLocale}"`);
    }
    // In DEV wrap in angle brackets so missing keys are visually obvious in the UI
    return import.meta.env.DEV ? `‹${key}›` : key;
  }

  locEx(key: string, params: Record<string, string | number>): string {
    const template = this.loc(key);
    return this.interpolate(template, params);
  }

  getAvailableLocales(): LocaleInfo[] {
    return LOCALE_REGISTRY.filter(info => {
      if (info.isDevOnly && !import.meta.env.DEV) return false;
      return this.dictionaries.has(info.code);
    });
  }

  getResolvedLocale(): string {
    return this.resolvedLocale;
  }

  getPreference(): LanguagePreference {
    return this.preference;
  }

  private resolveLocale(): string {
    if (this.preference !== 'system' && this.dictionaries.has(this.preference)) {
      return this.preference;
    }
    const browserLang = (navigator.language ?? 'en').split('-')[0].toLowerCase();
    if (this.dictionaries.has(browserLang)) return browserLang;
    return this.fallbackLocale;
  }

  private interpolate(template: string, params: Record<string, string | number>): string {
    return template.replace(TOKEN_RE, (_match, content: string) => {
      if (content.includes('|')) {
        const parts = content.split('|');
        const paramName = parts[0];
        const forms = parts.slice(1);
        const value = params[paramName];
        if (value === undefined || typeof value !== 'number') return _match;
        const formIndex = getPluralForm(this.resolvedLocale, value);
        return forms[Math.min(formIndex, forms.length - 1)] ?? _match;
      }
      const value = params[content];
      return value !== undefined ? String(value) : _match;
    });
  }
}

export const i18nService = new I18nService();
