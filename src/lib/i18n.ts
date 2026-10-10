import { fr, type Key } from './locales/fr'
import { en } from './locales/en'
import { es } from './locales/es'
import { de } from './locales/de'

export const LANGUAGES = [
  { code: 'fr', label: 'Français', locale: 'fr-FR' },
  { code: 'en', label: 'English', locale: 'en-GB' },
  { code: 'es', label: 'Español', locale: 'es-ES' },
  { code: 'de', label: 'Deutsch', locale: 'de-DE' },
] as const

const dicts: Record<string, Partial<Record<Key, string>>> = { fr, en, es, de }
export type TFn = (key: Key, vars?: Record<string, string | number>) => string

export function makeT(lang: string): TFn {
  const d = dicts[lang] ?? fr
  return (key, vars) => {
    let s = d[key] ?? fr[key] ?? key
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }
}
export const localeOf = (lang: string) => LANGUAGES.find((l) => l.code === lang)?.locale ?? 'fr-FR'
export type { Key }
