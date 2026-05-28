import { en } from './dictionaries/en';
import { es } from './dictionaries/es';

type Locale = 'es' | 'en';
type Dictionary = typeof es;

const dictionaries: Record<Locale, Dictionary> = {
  es,
  en: en as unknown as Dictionary,
};

export function createTranslator(locale: Locale = 'es') {
  const dict = dictionaries[locale];
  return (key: string): string => {
    const value = key.split('.').reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[segment];
      }
      return undefined;
    }, dict);

    return typeof value === 'string' ? value : key;
  };
}
