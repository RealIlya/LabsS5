import ru from "./ru.json";

export const translations = {
  ru,
};

export type TranslationLocale = keyof typeof translations;
