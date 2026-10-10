// All dates are stored as local calendar dates (yyyy-mm-dd) or local date-times (yyyy-mm-ddTHH:mm):
// no UTC conversion, so a vet appointment at 14:30 stays at 14:30 wherever the phone is.
const p = (n: number) => String(n).padStart(2, '0')
export const toISODate = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
export const today = () => toISODate(new Date())
export const parseDate = (s: string) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (s: string, n: number) => { const d = parseDate(s); d.setDate(d.getDate() + n); return toISODate(d) }
export const daysBetween = (a: string, b: string) => Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000)
export const monthKey = (s: string) => s.slice(0, 7)
export function parseLocalDateTime(s: string): Date {
  const [d, t = '00:00'] = s.split('T'); const [y, m, day] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number)
  return new Date(y, m - 1, day, h, mi)
}
export const fmtDate = (s: string, locale: string) =>
  parseDate(s).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtDateTime = (s: string, locale: string) =>
  parseLocalDateTime(s).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export function ageMonths(birth: string | null, approxMonths: number | null): number | null {
  if (!birth) return approxMonths
  const b = parseDate(birth), n = new Date()
  return (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth() - (n.getDate() < b.getDate() ? 1 : 0)
}
export function ageLabel(birth: string | null, approxMonths: number | null, t: (k: string, v?: any) => string): string {
  const months = ageMonths(birth, approxMonths)
  if (months == null || months < 0) return ''
  if (months < 24) return t('age.months', { n: months })
  return t('age.years', { n: Math.floor(months / 12) })
}
