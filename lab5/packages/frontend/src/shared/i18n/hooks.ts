import { useMemo } from "react";
import { TranslationLocale, translations } from "./translations";

export function useI18n(locale: TranslationLocale = "ru") {
  return useMemo(() => translations[locale], [locale]);
}
