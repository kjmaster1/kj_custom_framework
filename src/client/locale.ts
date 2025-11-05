import {GetLocale} from "./configRegistry";

let currentLanguage = 'en'; // Default language
const fallbackLanguage = 'en';

/**
 * A helper function to safely resolve nested properties from a string key.
 * e.g., resolveNested(obj, 'error.not_online') -> obj['error']['not_online']
 */
function resolveNested(obj: any, key: string): string | undefined {
  try {
    return key.split('.').reduce((acc, prop) => acc[prop], obj);
  } catch (e) {
    return undefined;
  }
}

/**
 * Sets the client's current language.
 * @param lang Language code (e.g., 'fr', 'de')
 */
export function SetLanguage(lang: string) {
  currentLanguage = lang.toLowerCase();
  console.log(`[Locale] Language set to: ${currentLanguage}`);
}

/**
 * Gets a translated string for the given key.
 * Replaces '%s' placeholders with provided arguments.
 * @param key The translation key (e.g., 'error.not_online')
 * @param args Values to replace '%s' placeholders.
 */
export function Lang(key: string, ...args: any[]): string {
  // 1. Try to get the string from the currently selected language
  let langData = GetLocale(currentLanguage);
  let translation = resolveNested(langData, key);

  // 2. If not found, fall back to the default language (e.g., 'en')
  if (!translation && currentLanguage !== fallbackLanguage) {
    langData = GetLocale(fallbackLanguage);
    translation = resolveNested(langData, key);
  }

  // 3. If still not found, return the key itself
  if (!translation) {
    return key;
  }

  // 4. Handle placeholders (e.g., %s)
  if (args.length > 0) {
    // This regex replaces all instances of %s sequentially with the arguments
    let i = 0;
    translation = translation.replace(/%s/g, () => {
      const arg = args[i];
      i++;
      return arg !== undefined ? arg : '%s';
    });
  }

  return translation;
}
