import { useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../state'
import { Button, Card, Confirm, Empty, H } from '../components/ui'
import { ExpenseForm } from '../components/forms'
import { expenseTotals } from '../lib/stats'
import { fmtDate, parseDate } from '../lib/dates'
import type { Expense } from '../lib/types'

export function Expenses() {
  const { t, data, dog, dogId, remove, money, locale, settings, updateSettings } = useApp()
  const [form, setForm] = useState<null | { e?: Expense }>(null); const [del, setDel] = useState<string | null>(null)
  if (!dog) return <Empty title={t('dog.none')} hint={t('dog.noneHint')} />
  const mine = data.expenses.filter((e) => e.dog_id === dogId)
  const tot = expenseTotals(mine)
  const cats = Object.entries(tot.byCategory).sort((a, b) => b[1] - a[1])
  const perDog = data.dogs.map((d) => ({ d, total: expenseTotals(data.expenses.filter((e) => e.dog_id === d.id)).year }))
  const budget = settings.budget_monthly
  return (
    <div className="space-y-4">
      <h1 className="text-2xl">{t('expense.title')}</h1>
      <Button className="w-full" onClick={() => setForm({})}>{t('expense.add')}</Button>
      <div className="grid grid-cols-3 gap-3">{([['expense.month', tot.month], ['expense.year', tot.year], ['expense.avg', tot.avgMonthly]] as const).map(([k, v]) => <Card key={k} className="!p-3 text-center"><div className="font-display text-lg">{money(v)}</div><div className="text-[11px] text-muted">{t(k)}</div></Card>)}</div>
      <Card><H>{t('expense.budget')}</H>
        <input inputMode="decimal" aria-label={t('expense.budget')} placeholder="—" defaultValue={budget ?? ''} onBlur={(e) => { const n = Number(e.target.value.replace(',', '.')); updateSettings({ budget_monthly: e.target.value && n > 0 ? n : null }) }} />
        {budget != null && <><div className="mt-3 h-2 overflow-hidden rounded-full bg-line"><div className={`h-full ${tot.month > budget ? 'bg-warn' : 'bg-primary'}`} style={{ width: `${Math.min(100, (tot.month / budget) * 100)}%` }} /></div><p className="mt-1 text-xs text-muted">{t('expense.budgetUsed', { used: money(tot.month), budget: money(budget) })}</p></>}</Card>
      {mine.length === 0 ? <Empty title={t('expense.empty')} action={<Button onClick={() => setForm({})}>{t('expense.add')}</Button>} /> : <>
        <Card><H>{t('expense.byMonth')}</H><div className="h-40" role="img" aria-label={t('expense.byMonth')}><ResponsiveContainer><BarChart data={tot.byMonth.map((m) => ({ m: parseDate(m.key + '-01').toLocaleDateString(locale, { month: 'narrow' }), v: +m.total.toFixed(2) }))} margin={{ left: -24, right: 4 }}>
          <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} /><Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12 }} /><Bar dataKey="v" fill="rgb(var(--primary))" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><H>{t('expense.byCategory')}</H><ul className="space-y-2.5">{cats.map(([c, v]) => <li key={c}><div className="flex justify-between text-sm"><span>{t(`cat.${c}` as any)}</span><span>{money(v)}</span></div><div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-sage" style={{ width: `${(v / tot.year) * 100}%` }} /></div></li>)}</ul></Card>
        {data.dogs.length > 1 && <Card><H>{t('expense.perDog')}</H><ul className="space-y-1.5 text-sm">{perDog.map((p) => <li key={p.d.id} className="flex justify-between"><span>{p.d.name}</span><span>{money(p.total)}</span></li>)}</ul></Card>}
        <ul className="divide-y divide-line rounded-card bg-card px-4">{[...mine].sort((a, b) => b.date.localeCompare(a.date)).map((e) => <li key={e.id} className="py-3">
          <div className="flex justify-between gap-2"><span className="min-w-0 truncate font-medium">{e.merchant || t(`cat.${e.category}` as any)}</span><span className="font-medium">{money(e.amount)}</span></div>
          <p className="text-xs text-muted">{t(`cat.${e.category}` as any)} · {fmtDate(e.date, locale)}{e.insurance_refund ? ` · −${money(e.insurance_refund)}` : ''}</p>
          <div className="mt-1 flex gap-4 text-sm text-primary underline"><button onClick={() => setForm({ e })}>{t('common.edit')}</button><button onClick={() => setDel(e.id)}>{t('common.delete')}</button></div></li>)}</ul></>}
      <p className="text-xs text-muted">{t('expense.currencyNote')}</p>
      {form && <ExpenseForm expense={form.e} onClose={() => setForm(null)} />}
      {del && <Confirm text={t('common.confirmDelete')} onNo={() => setDel(null)} onYes={async () => { await remove('expenses', del); setDel(null) }} />}
    </div>
  )
}
