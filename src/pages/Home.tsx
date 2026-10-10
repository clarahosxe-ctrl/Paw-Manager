import { useMemo, useState } from 'react'
import { useApp } from '../state'
import { Avatar, Button, Card, Empty, H, Ring, Sheet } from '../components/ui'
import { ActivityForm, AppointmentForm, ExpenseForm, HealthForm, MealForm, WeightForm } from '../components/forms'
import { addDays, fmtDate, fmtDateTime, today, ageLabel } from '../lib/dates'
import { wellbeingTracking } from '../lib/stats'

type Modal = null | 'weight' | 'expense' | 'appt' | 'treatment' | 'vaccine' | 'meal' | 'walk' | 'observation' | 'menu'
export function Home({ go, openDog }: { go: (tab: string) => void; openDog: () => void }) {
  const { t, data, dog, dogId, settings, locale, money } = useApp()
  const [modal, setModal] = useState<Modal>(null)
  const [detail, setDetail] = useState<{ title: string; lines: string[] } | null>(null)
  const td = today()
  const mine = useMemo(() => {
    const f = <T extends { dog_id: string }>(l: T[]) => l.filter((x) => x.dog_id === dogId)
    return { health: f(data.health), appts: f(data.appointments), acts: f(data.activities), meals: f(data.meals), routines: f(data.routines), weights: f(data.weights), expenses: f(data.expenses) }
  }, [data, dogId])

  if (!dog) return <Empty title={t('dog.none')} hint={t('dog.noneHint')} action={<Button onClick={openDog}>{t('dog.add')}</Button>} />

  const horizon = addDays(td, 30)
  const items = [
    ...mine.health.filter((h) => h.next_date && h.next_date <= horizon && h.kind !== 'allergy').map((h) => ({ key: h.id, date: h.next_date!, text: h.next_date! < td ? t('review.overdue', { title: h.title, date: fmtDate(h.next_date!, locale) }) : t('review.due', { title: h.title, date: fmtDate(h.next_date!, locale) }), overdue: h.next_date! < td })),
    ...mine.appts.filter((a) => a.at.slice(0, 10) >= td && a.at.slice(0, 10) <= horizon).map((a) => ({ key: a.id, date: a.at.slice(0, 10), text: t('review.apptSoon', { title: a.reason, date: fmtDateTime(a.at, locale) }), overdue: false })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const nextAppt = mine.appts.filter((a) => a.at >= `${td}T00:00`).sort((a, b) => a.at.localeCompare(b.at))[0]
  const mealsToday = mine.meals.filter((m) => m.at.startsWith(td)).length
  const minToday = mine.acts.filter((a) => a.date === td).reduce((s, a) => s + a.minutes, 0)
  const wb = wellbeingTracking({ activities: mine.acts, meals: mine.meals, routines: mine.routines })

  const timeline = [
    ...mine.health.map((h) => ({ k: h.id, date: h.date, kind: h.kind, label: h.title, lines: [h.notes, h.provider, h.dose].filter(Boolean) })),
    ...mine.weights.map((w) => ({ k: w.id, date: w.date, kind: 'weight', label: `${w.kg} kg`, lines: [] as string[] })),
    ...mine.appts.map((a) => ({ k: a.id, date: a.at.slice(0, 10), kind: 'appointment', label: a.reason, lines: [a.vet, a.address, a.notes].filter(Boolean) })),
    ...mine.expenses.map((e) => ({ k: e.id, date: e.date, kind: 'expense', label: `${money(e.amount)} · ${e.merchant || t(`cat.${e.category}` as any)}`, lines: [e.note].filter(Boolean) })),
  ].filter((e) => e.date <= td).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  const quick: [string, Modal | 'calendar'][] = [['quick.appointment', 'appt'], ['quick.weight', 'weight'], ['quick.expense', 'expense'], ['quick.treatment', 'treatment'], ['quick.vaccine', 'vaccine'], ['quick.calendar', 'calendar']]
  const crit = { activity: t('wellbeing.activity'), meals: t('wellbeing.meals'), routines: t('wellbeing.routines') }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Avatar name={dog.name} size={52} />
        <div><h1 className="text-2xl">{settings.display_name ? t('hello', { name: settings.display_name }) : t('hello.anon')}</h1>
          <p className="text-sm text-muted">{dog.name}{dog.breed && ` · ${dog.breed}`}{ageLabel(dog.birth_date, dog.approx_age_months, t as any) && ` · ${ageLabel(dog.birth_date, dog.approx_age_months, t as any)}`}</p></div></div>

      <Card>
        <H>{t('review.title')}</H>
        {items.length ? <ul className="space-y-2">{items.slice(0, 4).map((i) => <li key={i.key} className="flex items-start gap-2 text-sm"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i.overdue ? 'bg-warn' : 'bg-ok'}`} />{i.text}</li>)}</ul> : <p className="text-sm text-muted">{t('review.nothing')}</p>}
        <p className="mt-3 text-xs text-muted">{t('review.hint')}</p>
        <Button className="mt-3 w-full" onClick={() => go('health')}>{t('review.cta')}</Button>
      </Card>

      <Card>
        <H>{t('overview.title')}</H>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><div className="font-display text-2xl">{mealsToday}</div><div className="text-xs text-muted">{t('overview.meals')}</div></div>
          <div><div className="font-display text-2xl">{t('overview.min', { n: minToday })}</div><div className="text-xs text-muted">{t('overview.activity')}</div></div>
          <div><div className="font-display text-base leading-8">{nextAppt ? fmtDateTime(nextAppt.at, locale) : t('overview.none')}</div><div className="text-xs text-muted">{t('overview.next')}</div></div>
        </div>
        <Button className="mt-4 w-full" onClick={() => setModal('menu')}>{t('quick.add')}</Button>
      </Card>

      <Card className="flex items-center gap-4">
        <Ring value={wb.score} label={wb.score == null ? '—' : `${wb.score}%`} sub={wb.score == null ? t('wellbeing.insufficient') : undefined} />
        <div className="min-w-0 text-sm"><h2 className="mb-1 text-lg">{t('wellbeing.title')}</h2>
          {wb.score == null ? <p className="text-muted">{t('wellbeing.insufficient')}</p> : <ul className="space-y-0.5 text-xs text-muted">{wb.criteria.map((c) => <li key={c.key}>{crit[c.key]} : {c.done}/{c.total}</li>)}</ul>}
          <p className="mt-2 text-xs text-muted">{t('wellbeing.note')}</p></div>
      </Card>

      <Card>
        <H>{t('timeline.title')}</H>
        {timeline.length ? <ul className="divide-y divide-line">{timeline.map((e) => (
          <li key={e.k}><button className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => setDetail({ title: e.label, lines: [`${t(`kind.${e.kind}` as any)} · ${fmtDate(e.date, locale)}`, ...e.lines] })}>
            <span className="min-w-0"><span className="block truncate font-medium">{e.label}</span><span className="text-xs text-muted">{t(`kind.${e.kind}` as any)}</span></span>
            <span className="shrink-0 text-xs text-muted">{fmtDate(e.date, locale)}</span></button></li>))}</ul> : <p className="text-sm text-muted">{t('timeline.empty')}</p>}
      </Card>

      <Card>
        <H>{t('quick.title')}</H>
        <div className="grid grid-cols-2 gap-2">{quick.map(([k, m]) => <Button key={k} variant="ghost" onClick={() => (m === 'calendar' ? go('health') : setModal(m))}>{t(k as any)}</Button>)}</div>
      </Card>

      {modal === 'menu' && <Sheet title={t('quick.add')} onClose={() => setModal(null)}><div className="grid grid-cols-2 gap-3">
        {([['quick.meal', 'meal'], ['quick.walk', 'walk'], ['quick.weight', 'weight'], ['quick.observation', 'observation']] as const).map(([k, m]) => <Button key={k} variant="ghost" className="h-20" onClick={() => setModal(m)}>{t(k)}</Button>)}</div></Sheet>}
      {modal === 'weight' && <WeightForm onClose={() => setModal(null)} />}
      {modal === 'expense' && <ExpenseForm onClose={() => setModal(null)} />}
      {modal === 'appt' && <AppointmentForm onClose={() => setModal(null)} />}
      {modal === 'treatment' && <HealthForm kind="treatment" onClose={() => setModal(null)} />}
      {modal === 'vaccine' && <HealthForm kind="vaccine" onClose={() => setModal(null)} />}
      {modal === 'meal' && <MealForm onClose={() => setModal(null)} />}
      {modal === 'walk' && <ActivityForm type="walk" onClose={() => setModal(null)} />}
      {modal === 'observation' && <ActivityForm type="observation" onClose={() => setModal(null)} />}
      {detail && <Sheet title={detail.title} onClose={() => setDetail(null)}><ul className="space-y-1 text-sm">{detail.lines.map((l, i) => <li key={i}>{l}</li>)}</ul></Sheet>}
    </div>
  )
}
