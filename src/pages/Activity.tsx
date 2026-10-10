import { useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useApp } from '../state'
import { Button, Card, Confirm, Empty, H } from '../components/ui'
import { ActivityForm, MealForm, RoutineForm } from '../components/forms'
import { addDays, fmtDate, fmtDateTime, parseDate, today } from '../lib/dates'

export function Activity() {
  const { t, data, dog, dogId, save, remove, locale } = useApp()
  const [form, setForm] = useState<null | 'act' | 'meal' | 'routine'>(null)
  const [del, setDel] = useState<null | { table: 'activities' | 'routines' | 'meals'; id: string }>(null)
  if (!dog) return <Empty title={t('dog.none')} hint={t('dog.noneHint')} />
  const td = today()
  const acts = data.activities.filter((a) => a.dog_id === dogId).sort((a, b) => b.date.localeCompare(a.date))
  const meals = data.meals.filter((m) => m.dog_id === dogId).sort((a, b) => b.at.localeCompare(a.at))
  const routines = data.routines.filter((r) => r.dog_id === dogId)
  const week = Array.from({ length: 7 }, (_, i) => addDays(td, i - 6)).map((d) => ({ d: parseDate(d).toLocaleDateString(locale, { weekday: 'short' }), min: acts.filter((a) => a.date === d).reduce((s, a) => s + a.minutes, 0) }))
  return (
    <div className="space-y-4">
      <h1 className="text-2xl">{t('activity.title')}</h1>
      <div className="grid grid-cols-2 gap-2"><Button onClick={() => setForm('act')}>{t('quick.walk')}</Button><Button variant="ghost" onClick={() => setForm('meal')}>{t('quick.meal')}</Button></div>
      <Card><H>{t('activity.week')}</H>
        <div className="h-36" role="img" aria-label={t('activity.week')}><ResponsiveContainer><BarChart data={week} margin={{ left: -28, right: 4 }}><XAxis dataKey="d" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} /><Bar dataKey="min" fill="rgb(var(--primary))" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card><H right={<button className="text-sm text-primary underline" onClick={() => setForm('routine')}>{t('common.add')}</button>}>{t('activity.routines')}</H>
        {routines.length ? <ul className="space-y-2">{routines.map((r) => (
          <li key={r.id} className="flex items-center gap-3">
            <input type="checkbox" aria-label={r.label} disabled={!r.enabled} checked={r.done_dates.includes(td)} onChange={() => save('routines', { ...r, done_dates: r.done_dates.includes(td) ? r.done_dates.filter((d) => d !== td) : [...r.done_dates, td] })} />
            <span className={`flex-1 ${r.enabled ? '' : 'text-muted line-through'}`}>{r.label}</span>
            <button className="text-xs text-primary underline" onClick={() => save('routines', { ...r, enabled: !r.enabled })}>{r.enabled ? 'off' : 'on'}</button>
            <button aria-label={t('common.delete')} className="text-muted" onClick={() => setDel({ table: 'routines', id: r.id })}>×</button></li>))}</ul> : <p className="text-sm text-muted">{t('common.empty')}</p>}</Card>
      <Card><H>{t('activity.log')}</H>
        {acts.length || meals.length ? <ul className="divide-y divide-line text-sm">
          {[...acts.map((a) => ({ k: a.id, tb: 'activities' as const, s: a.date, l: `${t(`activity.${a.type}` as any)}${a.minutes ? ` · ${a.minutes} min` : ''}`, n: a.notes, when: fmtDate(a.date, locale) })),
            ...meals.map((m) => ({ k: m.id, tb: 'meals' as const, s: m.at, l: `${t('quick.meal')}${m.grams ? ` · ${m.grams} g` : ''}${m.product ? ` · ${m.product}` : ''}`, n: m.appetite, when: fmtDateTime(m.at, locale) }))]
            .sort((a, b) => b.s.localeCompare(a.s)).slice(0, 30).map((e) => <li key={e.k} className="flex items-center justify-between gap-2 py-2.5"><span className="min-w-0"><span className="block truncate">{e.l}</span>{e.n && <span className="block truncate text-xs text-muted">{e.n}</span>}<span className="text-xs text-muted">{e.when}</span></span>
              <button className="shrink-0 text-primary underline" onClick={() => setDel({ table: e.tb, id: e.k })}>{t('common.delete')}</button></li>)}</ul> : <p className="text-sm text-muted">{t('common.empty')}</p>}</Card>
      {form === 'act' && <ActivityForm onClose={() => setForm(null)} />}{form === 'meal' && <MealForm onClose={() => setForm(null)} />}{form === 'routine' && <RoutineForm onClose={() => setForm(null)} />}
      {del && <Confirm text={t('common.confirmDelete')} onNo={() => setDel(null)} onYes={async () => { await remove(del.table, del.id); setDel(null) }} />}
    </div>
  )
}
