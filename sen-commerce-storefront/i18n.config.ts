// All EU countries with their official languages
export const locales = [
  'en', // English (Malta, Ireland, Cyprus)
  'de', // German (Germany, Austria)
  'fr', // French (France)
  'es', // Spanish (Spain)
  'it', // Italian (Italy)
  'pt', // Portuguese (Portugal)
  'nl', // Dutch (Netherlands)
  'pl', // Polish (Poland)
  'cs', // Czech (Czech Republic)
  'sk', // Slovak (Slovakia)
  'hu', // Hungarian (Hungary)
  'ro', // Romanian (Romania)
  'bg', // Bulgarian (Bulgaria)
  'hr', // Croatian (Croatia)
  'sl', // Slovenian (Slovenia)
  'lv', // Latvian (Latvia)
  'lt', // Lithuanian (Lithuania)
  'et', // Estonian (Estonia)
  'el', // Greek (Greece)
  'sv', // Swedish (Sweden)
  'da', // Danish (Denmark)
  'fi', // Finnish (Finland)
  'mt', // Maltese (Malta)
  'ga', // Irish (Ireland)
] as const

export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français', 
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  cs: 'Čeština',
  sk: 'Slovenčina',
  hu: 'Magyar',
  ro: 'Română',
  bg: 'Български',
  hr: 'Hrvatski',
  sl: 'Slovenščina',
  lv: 'Latviešu',
  lt: 'Lietuvių',
  et: 'Eesti',
  el: 'Ελληνικά',
  sv: 'Svenska',
  da: 'Dansk',
  fi: 'Suomi',
  mt: 'Malti',
  ga: 'Gaeilge'
}

export const localeCurrencies: Record<Locale, string> = {
  en: 'EUR', // Euro for EU countries
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  it: 'EUR',
  pt: 'EUR',
  nl: 'EUR',
  pl: 'PLN', // Polish Złoty (not Eurozone)
  cs: 'CZK', // Czech Koruna (not Eurozone) 
  sk: 'EUR',
  hu: 'HUF', // Hungarian Forint (not Eurozone)
  ro: 'RON', // Romanian Leu (not Eurozone)
  bg: 'BGN', // Bulgarian Lev (not Eurozone)
  hr: 'EUR', // Croatia joined Eurozone in 2023
  sl: 'EUR',
  lv: 'EUR',
  lt: 'EUR',
  et: 'EUR',
  el: 'EUR',
  sv: 'SEK', // Swedish Krona (not Eurozone)
  da: 'DKK', // Danish Krone (not Eurozone)
  fi: 'EUR',
  mt: 'EUR',
  ga: 'EUR'
}