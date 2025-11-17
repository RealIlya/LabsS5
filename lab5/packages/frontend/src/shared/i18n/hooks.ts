import { useMemo } from "react";
import { translations, TranslationLocale } from "./translations";

export function useI18n(locale: TranslationLocale = "ru") {
  return useMemo(() => translations[locale], [locale]);
}
