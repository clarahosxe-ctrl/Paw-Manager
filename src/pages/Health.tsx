import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../state'
import { Button, Card, Confirm, Empty, Pill } from '../components/ui'
import { AppointmentForm, HealthForm, WeightForm } from '../components/forms'
import { fmtDate, fmtDateTime, today, parseDate, ageMonths } from '../lib/dates'
import { weightDelta } from '../lib/stats'
import type { Appointment, HealthKind, HealthRecord } from '../lib/types'

type Tab = 'vaccines' | 'care' | 'appointments' | 'treatments' | 'weight' | 'notes'
const KIND: Record<string, HealthKind> = { vaccines: 'vaccine', care: 'antiparasitic', treatments: 'treatment' }

export function Health() {
  const { t, data, dog, dogId, remove, locale } = useApp()
  const [tab, setTab] = useState<Tab>('vaccines')
  const [form, setForm] = useState<null | { kind: HealthKind; rec?: HealthRecord } | 'appt' | 'weight' | { appt: Appointment }>(null)
  const [del, setDel] = useState<null | { table: 'health' | 'appointments' | 'weights'; id: string }>(null)
  if (!dog) return <Empty title={t('dog.none')} hint={t('dog.noneHint')} />
  const td = today()
  const recs = (k: HealthKind) => data.health.filter((h) => h.dog_id === dogId && h.kind === k).sort((a, b) => b.date.localeCompare(a.date))
  const status = (h: HealthRecord) => (h.next_date ? (h.next_date < td ? <Pill tone="warn">{t('status.overdue')}</Pill> : <Pill>{t('status.upcoming')}</Pill>) : <Pill tone="ok">{t('status.done')}</Pill>)
  const tabs: Tab[] = ['vaccines', 'care', 'appointments', 'treatments', 'weight', 'notes']

  const list = (kind: HealthKind) => {
    const rows = recs(kind)
    return <>
      {kind === 'antiparasitic' && <p className="mb-3 text-xs text-muted">{t('health.doseHint')}</p>}
      <Button className="mb-3 w-full" onClick={() => setForm({ kind })}>{t('common.add')}</Button>
      {rows.length ? <ul className="space-y-2">{rows.map((h) => (
        <li key={h.id} className="rounded-card bg-card p-4"><div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><p className="truncate font-medium">{h.title}</p>
            <p className="text-xs text-muted">{fmtDate(h.date, locale)}{h.next_date && ` → ${fmtDate(h.next_date, locale)}`}{h.end_date && ` → ${fmtDate(h.end_date, locale)}`}</p>
            {h.dose && <p className="text-xs text-muted">{h.dose}</p>}{h.provider && <p className="text-xs text-muted">{h.provider}</p>}{h.notes && <p className="mt-1 text-sm">{h.notes}</p>}</div>
          <div className="flex shrink-0 flex-col items-end gap-1">{kind === 'vaccine' || kind === 'antiparasitic' ? status(h) : null}
            <Pill tone={h.vet_confirmed ? 'ok' : 'sage'}>{h.vet_confirmed ? t('health.vetConfirmed') : t('health.personal')}</Pill></div></div>
          <div className="mt-2 flex gap-4 text-sm text-primary underline"><button onClick={() => setForm({ kind, rec: h })}>{t('common.edit')}</button><button onClick={() => setDel({ table: 'health', id: h.id })}>{t('common.delete')}</button></div></li>))}</ul>
        : <Empty title={t('common.empty')} />}
    </>
  }

  const appts = data.appointments.filter((a) => a.dog_id === dogId)
  const now = `${td}T00:00`
  const upcoming = appts.filter((a) => a.at >= now).sort((a, b) => a.at.localeCompare(b.at)), past = appts.filter((a) => a.at < now).sort((a, b) => b.at.localeCompare(a.at))
  const apptRow = (a: Appointment) => (
    <li key={a.id} className="rounded-card bg-card p-4"><p className="font-medium">{a.reason}</p><p className="text-xs text-muted">{fmtDateTime(a.at, locale)}{a.vet && ` · ${a.vet}`}</p>
      {a.address && <p className="text-xs text-muted">{a.address}</p>}{a.phone && <a className="text-xs text-primary underline" href={`tel:${a.phone}`}>{a.phone}</a>}
      <div className="mt-2 flex gap-4 text-sm text-primary underline"><button onClick={() => setForm({ appt: a })}>{t('common.edit')}</button><button onClick={() => setDel({ table: 'appointments', id: a.id })}>{t('common.delete')}</button></div></li>)

  const ws = weightDelta(data.weights.filter((w) => w.dog_id === dogId))
  const young = (ageMonths(dog.birth_date, dog.approx_age_months) ?? 99) < 18

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">{t('health.title')}</h1>
      <p className="text-xs text-muted">{t('health.disclaimer')}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">{tabs.map((x) => <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === x ? 'bg-primary text-onprimary' : 'bg-card'}`}>{t(`health.tab.${x}` as any)}</button>)}</div>

      {(tab === 'vaccines' || tab === 'care' || tab === 'treatments') && list(KIND[tab])}
      {tab === 'notes' && <>
        <div className="mb-3 grid grid-cols-2 gap-2"><Button onClick={() => setForm({ kind: 'allergy' })}>{t('kind.allergy')}</Button><Button variant="ghost" onClick={() => setForm({ kind: 'history' })}>{t('kind.history')}</Button></div>
        {[...recs('allergy'), ...recs('history')].length ? <ul className="space-y-2">{[...recs('allergy'), ...recs('history')].map((h) => <li key={h.id} className="rounded-card bg-card p-4">
          <div className="flex justify-between gap-2"><p className="font-medium">{h.title}</p><Pill tone={h.vet_confirmed ? 'ok' : 'sage'}>{h.vet_confirmed ? t('health.vetConfirmed') : t('health.personal')}</Pill></div>
          <p className="text-xs text-muted">{t(`kind.${h.kind}` as any)} · {fmtDate(h.date, locale)}</p>{h.notes && <p className="mt-1 text-sm">{h.notes}</p>}
          <div className="mt-2 flex gap-4 text-sm text-primary underline"><button onClick={() => setForm({ kind: h.kind, rec: h })}>{t('common.edit')}</button><button onClick={() => setDel({ table: 'health', id: h.id })}>{t('common.delete')}</button></div></li>)}</ul> : <Empty title={t('common.empty')} />}</>}
      {tab === 'appointments' && <>
        <Button className="mb-3 w-full" onClick={() => setForm('appt')}>{t('common.add')}</Button>
        <h2 className="text-lg">{t('appt.upcoming')}</h2>{upcoming.length ? <ul className="space-y-2">{upcoming.map(apptRow)}</ul> : <Empty title={t('common.empty')} />}
        {past.length > 0 && <><h2 className="pt-2 text-lg">{t('appt.past')}</h2><ul className="space-y-2">{past.map(apptRow)}</ul></>}</>}
      {tab === 'weight' && <>
        <Button className="mb-3 w-full" onClick={() => setForm('weight')}>{t('weight.add')}</Button>
        <Card>{ws.length >= 2 ? <div className="h-52" role="img" aria-label={t('health.tab.weight')}><ResponsiveContainer><LineChart data={ws.map((w) => ({ d: parseDate(w.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' }), kg: w.kg }))} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid stroke="rgb(var(--line))" vertical={false} /><XAxis dataKey="d" tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'rgb(var(--muted))' }} />
          <Tooltip formatter={(v) => [`${v} kg`, '']} contentStyle={{ borderRadius: 12 }} /><Line type="monotone" dataKey="kg" stroke="rgb(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
          : <p className="text-sm text-muted">{t('weight.chartEmpty')}</p>}
          {young && <p className="mt-3 text-xs text-muted">{t('weight.puppyNote')}</p>}</Card>
        <h2 className="text-lg">{t('weight.history')}</h2>
        {ws.length ? <ul className="divide-y divide-line rounded-card bg-card px-4">{[...ws].reverse().map((w) => <li key={w.id} className="flex items-center justify-between py-3 text-sm">
          <span>{fmtDate(w.date, locale)}</span><span className="font-medium">{w.kg} kg {w.delta != null && <span className={`ml-1 text-xs ${w.delta > 0 ? 'text-warn' : 'text-ok'}`}>{w.delta > 0 ? '+' : ''}{w.delta}</span>}</span>
          <button className="text-primary underline" onClick={() => setDel({ table: 'weights', id: w.id })}>{t('common.delete')}</button></li>)}</ul> : <Empty title={t('common.empty')} />}</>}

      {form && typeof form === 'object' && 'kind' in form && <HealthForm kind={form.kind} record={form.rec} onClose={() => setForm(null)} />}
      {form === 'appt' && <AppointmentForm onClose={() => setForm(null)} />}
      {form && typeof form === 'object' && 'appt' in form && <AppointmentForm appt={form.appt} onClose={() => setForm(null)} />}
      {form === 'weight' && <WeightForm onClose={() => setForm(null)} />}
      {del && <Confirm text={t('common.confirmDelete')} onNo={() => setDel(null)} onYes={async () => { await remove(del.table, del.id); setDel(null) }} />}
    </div>
  )
}
