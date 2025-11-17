import type { translations } from "./translations";

export type LocaleMessages = (typeof translations)[keyof typeof translations];
