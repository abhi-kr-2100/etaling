// ISO 639-1 codes: https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
export const LANGUAGE_CODES = ["es", "ja", "ru", "tr", "en", "de"] as const;
export const LANGUAGE_ABBRS = [
  "spa",
  "jpn",
  "rus",
  "tur",
  "eng",
  "deu",
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];
export type LanguageAbbr = (typeof LANGUAGE_ABBRS)[number];

export const LANG_CODE_TO_ABBR = {
  es: "spa",
  ja: "jpn",
  ru: "rus",
  tr: "tur",
  en: "eng",
  de: "deu",
};

export const LANG_ABBR_TO_CODE = Object.fromEntries(
  Object.entries(LANG_CODE_TO_ABBR).map((a) => a.toReversed())
);
