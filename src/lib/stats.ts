import type { Expense, WeightEntry, Activity, Meal, Routine } from './types'
import { addDays, monthKey, today } from './dates'

export function expenseTotals(expenses: Expense[], now = today()) {
  const net = (e: Expense) => e.amount - (e.insurance_refund ?? 0)
  const month = monthKey(now), year = now.slice(0, 4)
  const inMonth = expenses.filter((e) => monthKey(e.date) === month)
  const inYear = expenses.filter((e) => e.date.startsWith(year))
  const sum = (l: Expense[]) => l.reduce((a, e) => a + net(e), 0)
  const byCategory: Record<string, number> = {}
  for (const e of inYear) byCategory[e.category] = (byCategory[e.category] ?? 0) + net(e)
  const monthsElapsed = Number(now.slice(5, 7))
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    return { key, total: sum(expenses.filter((e) => monthKey(e.date) === key)) }
  })
  return { month: sum(inMonth), year: sum(inYear), avgMonthly: monthsElapsed ? sum(inYear) / monthsElapsed : 0, byCategory, byMonth }
}

export function weightDelta(ws: WeightEntry[]) {
  const s = [...ws].sort((a, b) => a.date.localeCompare(b.date))
  return s.map((w, i) => ({ ...w, delta: i ? +(w.kg - s[i - 1].kg).toFixed(2) : null }))
}

/** Completeness of the daily routine — NOT a health measure. Optional unfollowed items are ignored. */
export function wellbeingTracking(opts: { activities: Activity[]; meals: Meal[]; routines: Routine[]; now?: string }) {
  const now = opts.now ?? today()
  const days = Array.from({ length: 7 }, (_, i) => addDays(now, -i))
  const criteria: { key: 'activity' | 'meals' | 'routines'; done: number; total: number }[] = []
  if (opts.activities.length) criteria.push({ key: 'activity', done: days.filter((d) => opts.activities.some((a) => a.date === d)).length, total: 7 })
  if (opts.meals.length) criteria.push({ key: 'meals', done: days.filter((d) => opts.meals.some((m) => m.at.startsWith(d))).length, total: 7 })
  const active = opts.routines.filter((r) => r.enabled)
  if (active.length) criteria.push({ key: 'routines', done: active.reduce((a, r) => a + days.filter((d) => r.done_dates.includes(d)).length, 0), total: active.length * 7 })
  if (criteria.length < 2) return { score: null as number | null, criteria }
  const score = Math.round((criteria.reduce((a, c) => a + c.done / c.total, 0) / criteria.length) * 100)
  return { score, criteria }
}
