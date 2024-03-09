// ISO 639-1 codes: https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
export const LANGUAGE_CODES = ["es", "ja", "ru", "tr", "en", "de"] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];
