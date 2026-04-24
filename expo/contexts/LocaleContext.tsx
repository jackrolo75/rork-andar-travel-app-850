import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { translations, LANGUAGES, TranslationKey } from '@/constants/languages';
import { CURRENCIES } from '@/constants/currencies';

const LOCALE_LANGUAGE_KEY = 'andar_locale_language';
const LOCALE_CURRENCY_KEY = 'andar_locale_currency';

async function loadPersistedLocale(): Promise<{ language: string; currency: string }> {
  try {
    const [lang, curr] = await Promise.all([
      AsyncStorage.getItem(LOCALE_LANGUAGE_KEY),
      AsyncStorage.getItem(LOCALE_CURRENCY_KEY),
    ]);
    return {
      language: lang || 'en',
      currency: curr || 'USD',
    };
  } catch (e) {
    console.error('[LocaleContext] Failed to load locale:', e);
    return { language: 'en', currency: 'USD' };
  }
}

export const [LocaleProvider, useLocale] = createContextHook(() => {
  const [language, setLanguageState] = useState<string>('en');
  const [currency, setCurrencyState] = useState<string>('USD');

  const localeQuery = useQuery({
    queryKey: ['locale-settings'],
    queryFn: loadPersistedLocale,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (localeQuery.data) {
      setLanguageState(localeQuery.data.language);
      setCurrencyState(localeQuery.data.currency);
      console.log('[LocaleContext] Loaded locale:', localeQuery.data);
    }
  }, [localeQuery.data]);

  const setLanguage = useCallback(async (code: string) => {
    setLanguageState(code);
    try {
      await AsyncStorage.setItem(LOCALE_LANGUAGE_KEY, code);
      console.log('[LocaleContext] Language saved:', code);
    } catch (e) {
      console.error('[LocaleContext] Failed to save language:', e);
    }
  }, []);

  const setCurrency = useCallback(async (code: string) => {
    setCurrencyState(code);
    try {
      await AsyncStorage.setItem(LOCALE_CURRENCY_KEY, code);
      console.log('[LocaleContext] Currency saved:', code);
    } catch (e) {
      console.error('[LocaleContext] Failed to save currency:', e);
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    const langTranslations = translations[language] || translations['en'];
    return langTranslations[key] || translations['en'][key] || key;
  }, [language]);

  const currentLanguage = useMemo(() => {
    return LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  }, [language]);

  const currentCurrency = useMemo(() => {
    return CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  }, [currency]);

  return useMemo(() => ({
    language,
    currency,
    setLanguage,
    setCurrency,
    t,
    currentLanguage,
    currentCurrency,
    isLoading: localeQuery.isLoading,
  }), [language, currency, setLanguage, setCurrency, t, currentLanguage, currentCurrency, localeQuery.isLoading]);
});
