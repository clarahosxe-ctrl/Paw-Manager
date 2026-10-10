import { describe, it, expect } from 'vitest'
import { expenseTotals, weightDelta, wellbeingTracking } from './stats'
import { dueReminders } from './reminders'
import { makeT } from './i18n'
import { fr } from './locales/fr'
import { en } from './locales/en'
import { es } from './locales/es'
import { de } from './locales/de'
import { addDays } from './dates'

const e = (date: string, amount: number, category: any = 'food', refund: number | null = null) => ({ id: date + amount, dog_id: 'd', date, amount, category, merchant: '', note: '', insurance_refund: refund })

describe('expenseTotals', () => {
  it('computes month, year, average and categories from real entries only', () => {
    const r = expenseTotals([e('2026-10-02', 50), e('2026-10-05', 30, 'vet', 10), e('2026-02-01', 20)], '2026-10-10')
    expect(r.month).toBe(70); expect(r.year).toBe(90); expect(r.avgMonthly).toBeCloseTo(9); expect(r.byCategory.vet).toBe(20)
    expect(r.byMonth[9].total).toBe(70)
  })
  it('returns zeros when nothing recorded', () => { expect(expenseTotals([], '2026-10-10').year).toBe(0) })
})
describe('weightDelta', () => {
  it('computes variation from previous entry', () => {
    const r = weightDelta([{ id: 'b', dog_id: 'd', date: '2026-02-01', kg: 12 }, { id: 'a', dog_id: 'd', date: '2026-01-01', kg: 10 }])
    expect(r.map((x) => x.delta)).toEqual([null, 2])
  })
})
describe('wellbeingTracking', () => {
  it('reports insufficient data with fewer than 2 tracked criteria and ignores untracked optional ones', () => {
    expect(wellbeingTracking({ activities: [], meals: [], routines: [] }).score).toBeNull()
    const now = '2026-10-10'
    const r = wellbeingTracking({ now, activities: [{ id: '1', dog_id: 'd', date: now, type: 'walk', minutes: 10, notes: '' }], meals: [{ id: 'm', dog_id: 'd', at: now + 'T08:00', kind: '', product: '', grams: null, appetite: '' }], routines: [] })
    expect(r.criteria.length).toBe(2); expect(r.score).toBe(14)
  })
})
describe('dueReminders', () => {
  const a = { id: 'a', dog_id: 'd', at: '2026-10-11T10:00', reason: '', vet: '', address: '', phone: '', notes: '', remind_minutes: 1440 }
  it('fires inside the window, once', () => {
    expect(dueReminders([a], new Date(2026, 9, 10, 12, 0), new Set()).length).toBe(1)
    expect(dueReminders([a], new Date(2026, 9, 10, 12, 0), new Set(['a'])).length).toBe(0)
    expect(dueReminders([a], new Date(2026, 9, 9, 12, 0), new Set()).length).toBe(0)
    expect(dueReminders([a], new Date(2026, 9, 11, 11, 0), new Set()).length).toBe(0)
  })
})
describe('i18n', () => {
  it('falls back to French and interpolates', () => {
    expect(makeT('de')('hello', { name: 'Ana' })).toBe('Hallo, Ana')
    expect(makeT('xx' as any)('hello', { name: 'Ana' })).toBe('Bonjour, Ana')
  })
  it('has no unknown keys in translations', () => {
    for (const d of [en, es, de]) for (const k of Object.keys(d)) expect(k in fr).toBe(true)
  })
})
describe('dates', () => { it('addDays crosses months', () => { expect(addDays('2026-01-31', 1)).toBe('2026-02-01') }) })
