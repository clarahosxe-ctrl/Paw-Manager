import { useState, type FormEvent, type ReactNode } from 'react'
import { useApp } from '../state'
import { Button, Field, Sheet } from './ui'
import { today } from '../lib/dates'
import type { ActivityType, Dog, Expense, ExpenseCategory, HealthKind, HealthRecord, Appointment } from '../lib/types'

type Errors = Record<string, string>
const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))

function FormShell({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: () => Promise<Errors | void>; children: (e: Errors) => ReactNode }) {
  const { t } = useApp()
  const [errs, setErrs] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); if (busy) return
    setBusy(true)
    try { const r = await onSubmit(); if (r) setErrs(r); else onClose() } catch (e: any) { setErrs({ _: e.message }) } finally { setBusy(false) }
  }
  return (
    <Sheet title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {children(errs)}
        {errs._ && <p role="alert" className="text-sm text-warn">{errs._}</p>}
        <div className="flex gap-3 pt-2"><Button type="button" variant="ghost" onClick={onClose} className="flex-1">{t('common.cancel')}</Button><Button type="submit" disabled={busy} className="flex-1">{t('common.save')}</Button></div>
      </form>
    </Sheet>
  )
}

export function DogForm({ dog, onClose }: { dog?: Dog; onClose: () => void }) {
  const { t, save, setDogId } = useApp()
  const [name, setName] = useState(dog?.name ?? ''); const [breed, setBreed] = useState(dog?.breed ?? '')
  const [birth, setBirth] = useState(dog?.birth_date ?? ''); const [age, setAge] = useState(dog?.approx_age_months?.toString() ?? '')
  const [sex, setSex] = useState<Dog['sex']>(dog?.sex ?? 'unknown'); const [kg, setKg] = useState(dog?.weight_kg?.toString() ?? '')
  return (
    <FormShell title={dog ? dog.name : t('dog.add')} onClose={onClose} onSubmit={async () => {
      const e: Errors = {}
      if (!name.trim()) e.name = t('common.required')
      const w = num(kg); if (kg && (!(w > 0) || w > 120)) e.kg = t('common.invalidNumber')
      if (age && !(num(age) >= 0)) e.age = t('common.invalidNumber')
      if (Object.keys(e).length) return e
      const id = await save('dogs', { id: dog?.id, name: name.trim(), breed: breed.trim(), birth_date: birth || null, approx_age_months: birth || !age ? null : Math.round(num(age)), sex, weight_kg: kg ? w : null, notes: dog?.notes ?? '', created_at: dog?.created_at ?? today() })
      if (!dog) {
        setDogId(id)
        if (kg) await save('weights', { dog_id: id, date: today(), kg: w })
      }
    }}>
      {(e) => <>
        <Field label={t('common.name')} error={e.name}>{(id) => <input id={id} value={name} onChange={(x) => setName(x.target.value)} autoFocus />}</Field>
        <Field label={t('dog.breed')}>{(id) => <input id={id} value={breed} onChange={(x) => setBreed(x.target.value)} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('dog.birth')}>{(id) => <input id={id} type="date" max={today()} value={birth} onChange={(x) => setBirth(x.target.value)} />}</Field>
          <Field label={t('dog.approxAge')} error={e.age}>{(id) => <input id={id} inputMode="numeric" disabled={!!birth} value={age} onChange={(x) => setAge(x.target.value)} />}</Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('dog.sex')}>{(id) => <select id={id} value={sex} onChange={(x) => setSex(x.target.value as Dog['sex'])}>{(['male', 'female', 'unknown'] as const).map((s) => <option key={s} value={s}>{t(`dog.sex.${s}` as any)}</option>)}</select>}</Field>
          <Field label={t('dog.weight')} error={e.kg}>{(id) => <input id={id} inputMode="decimal" value={kg} onChange={(x) => setKg(x.target.value)} />}</Field>
        </div>
      </>}
    </FormShell>
  )
}

export function WeightForm({ onClose }: { onClose: () => void }) {
  const { t, save, dogId, data } = useApp()
  const [kg, setKg] = useState(''); const [date, setDate] = useState(today())
  return (
    <FormShell title={t('weight.add')} onClose={onClose} onSubmit={async () => {
      const w = num(kg); const e: Errors = {}
      if (!(w > 0) || w > 120) e.kg = t('common.invalidNumber'); if (!date) e.date = t('common.required')
      if (Object.keys(e).length) return e
      const dup = data.weights.find((x) => x.dog_id === dogId && x.date === date)
      await save('weights', { id: dup?.id, dog_id: dogId!, date, kg: w }) // one weigh-in per day: replaces
      const dog = data.dogs.find((d) => d.id === dogId); const latest = [...data.weights.filter((x) => x.dog_id === dogId), { date, kg: w }].sort((a, b) => b.date.localeCompare(a.date))[0]
      if (dog && latest.date === date) await save('dogs', { ...dog, weight_kg: w })
    }}>
      {(e) => <>
        <Field label={t('weight.kg')} error={e.kg}>{(id) => <input id={id} inputMode="decimal" autoFocus value={kg} onChange={(x) => setKg(x.target.value)} />}</Field>
        <Field label={t('common.date')} error={e.date}>{(id) => <input id={id} type="date" max={today()} value={date} onChange={(x) => setDate(x.target.value)} />}</Field>
      </>}
    </FormShell>
  )
}

export const CATEGORIES: ExpenseCategory[] = ['vet', 'medication', 'food', 'insurance', 'grooming', 'training', 'boarding', 'accessories', 'toys', 'other']
export function ExpenseForm({ expense, onClose }: { expense?: Expense; onClose: () => void }) {
  const { t, save, dogId, data, settings } = useApp()
  const [amount, setAmount] = useState(expense?.amount.toString() ?? ''); const [date, setDate] = useState(expense?.date ?? today())
  const [cat, setCat] = useState<ExpenseCategory>(expense?.category ?? 'vet'); const [merchant, setMerchant] = useState(expense?.merchant ?? '')
  const [note, setNote] = useState(expense?.note ?? ''); const [refund, setRefund] = useState(expense?.insurance_refund?.toString() ?? '')
  const [dog, setDog] = useState(expense?.dog_id ?? dogId ?? '')
  return (
    <FormShell title={t('expense.add')} onClose={onClose} onSubmit={async () => {
      const a = num(amount), r = refund ? num(refund) : null; const e: Errors = {}
      if (!(a > 0)) e.amount = t('common.invalidNumber')
      if (r != null && (!(r >= 0) || r > a)) e.refund = t('common.invalidNumber')
      if (!dog) e.dog = t('common.required')
      if (Object.keys(e).length) return e
      await save('expenses', { id: expense?.id, dog_id: dog, date, amount: a, category: cat, merchant: merchant.trim(), note: note.trim(), insurance_refund: r })
    }}>
      {(e) => <>
        <Field label={`${t('expense.amount')} (${settings.currency})`} error={e.amount}>{(id) => <input id={id} inputMode="decimal" autoFocus value={amount} onChange={(x) => setAmount(x.target.value)} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('expense.category')}>{(id) => <select id={id} value={cat} onChange={(x) => setCat(x.target.value as ExpenseCategory)}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}` as any)}</option>)}</select>}</Field>
          <Field label={t('common.date')}>{(id) => <input id={id} type="date" value={date} onChange={(x) => setDate(x.target.value)} />}</Field>
        </div>
        {data.dogs.length > 1 && <Field label={t('dog.switch')} error={e.dog}>{(id) => <select id={id} value={dog} onChange={(x) => setDog(x.target.value)}>{data.dogs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>}</Field>}
        <Field label={t('expense.merchant')}>{(id) => <input id={id} value={merchant} onChange={(x) => setMerchant(x.target.value)} />}</Field>
        <Field label={t('expense.refund')} error={e.refund}>{(id) => <input id={id} inputMode="decimal" value={refund} onChange={(x) => setRefund(x.target.value)} />}</Field>
        <Field label={t('common.notes')}>{(id) => <input id={id} value={note} onChange={(x) => setNote(x.target.value)} />}</Field>
      </>}
    </FormShell>
  )
}

export function HealthForm({ kind, record, onClose }: { kind: HealthKind; record?: HealthRecord; onClose: () => void }) {
  const { t, save, dogId } = useApp()
  const [title, setTitle] = useState(record?.title ?? ''); const [date, setDate] = useState(record?.date ?? today())
  const [next, setNext] = useState(record?.next_date ?? ''); const [end, setEnd] = useState(record?.end_date ?? '')
  const [provider, setProvider] = useState(record?.provider ?? ''); const [dose, setDose] = useState(record?.dose ?? '')
  const [category, setCategory] = useState(record?.category ?? ''); const [notes, setNotes] = useState(record?.notes ?? '')
  const [vet, setVet] = useState(record?.vet_confirmed ?? false)
  const hasNext = kind === 'vaccine' || kind === 'antiparasitic', hasEnd = kind === 'treatment'
  return (
    <FormShell title={t(`kind.${kind}` as any)} onClose={onClose} onSubmit={async () => {
      const e: Errors = {}
      if (!title.trim()) e.title = t('common.required')
      if (next && next < date) e.next = t('common.invalidNumber'); if (end && end < date) e.end = t('common.invalidNumber')
      if (Object.keys(e).length) return e
      await save('health', { id: record?.id, dog_id: dogId!, kind, title: title.trim(), date, next_date: next || null, end_date: end || null, provider: provider.trim(), dose: dose.trim(), category: category.trim(), notes: notes.trim(), vet_confirmed: vet })
    }}>
      {(e) => <>
        <Field label={t('health.titleField')} error={e.title}>{(id) => <input id={id} autoFocus value={title} onChange={(x) => setTitle(x.target.value)} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('common.date')}>{(id) => <input id={id} type="date" value={date} onChange={(x) => setDate(x.target.value)} />}</Field>
          {hasNext && <Field label={t('health.next')} error={e.next}>{(id) => <input id={id} type="date" value={next} onChange={(x) => setNext(x.target.value)} />}</Field>}
          {hasEnd && <Field label={t('health.end')} error={e.end}>{(id) => <input id={id} type="date" value={end} onChange={(x) => setEnd(x.target.value)} />}</Field>}
        </div>
        {kind === 'antiparasitic' && <Field label={t('health.category')}>{(id) => <input id={id} value={category} onChange={(x) => setCategory(x.target.value)} />}</Field>}
        {(kind === 'antiparasitic' || kind === 'treatment') && <Field label={t('health.dose')} hint={t('health.doseHint')}>{(id) => <input id={id} value={dose} onChange={(x) => setDose(x.target.value)} />}</Field>}
        {kind !== 'allergy' && kind !== 'history' && <Field label={t('health.provider')}>{(id) => <input id={id} value={provider} onChange={(x) => setProvider(x.target.value)} />}</Field>}
        <Field label={t('common.notes')}>{(id) => <textarea id={id} rows={3} value={notes} onChange={(x) => setNotes(x.target.value)} />}</Field>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={vet} onChange={(x) => setVet(x.target.checked)} />{t('health.vetConfirmed')}</label>
      </>}
    </FormShell>
  )
}

export function AppointmentForm({ appt, onClose }: { appt?: Appointment; onClose: () => void }) {
  const { t, save, dogId } = useApp()
  const [at, setAt] = useState(appt?.at ?? `${today()}T10:00`); const [reason, setReason] = useState(appt?.reason ?? '')
  const [vet, setVet] = useState(appt?.vet ?? ''); const [address, setAddress] = useState(appt?.address ?? '')
  const [phone, setPhone] = useState(appt?.phone ?? ''); const [notes, setNotes] = useState(appt?.notes ?? '')
  const [remind, setRemind] = useState(appt?.remind_minutes?.toString() ?? '')
  return (
    <FormShell title={t('quick.appointment')} onClose={onClose} onSubmit={async () => {
      const e: Errors = {}; if (!reason.trim()) e.reason = t('common.required'); if (!at) e.at = t('common.required')
      if (Object.keys(e).length) return e
      await save('appointments', { id: appt?.id, dog_id: dogId!, at, reason: reason.trim(), vet: vet.trim(), address: address.trim(), phone: phone.trim(), notes: notes.trim(), remind_minutes: remind ? Number(remind) : null })
    }}>
      {(e) => <>
        <Field label={t('appt.reason')} error={e.reason}>{(id) => <input id={id} autoFocus value={reason} onChange={(x) => setReason(x.target.value)} />}</Field>
        <Field label={t('appt.when')} error={e.at}>{(id) => <input id={id} type="datetime-local" value={at} onChange={(x) => setAt(x.target.value)} />}</Field>
        <Field label={t('appt.vet')}>{(id) => <input id={id} value={vet} onChange={(x) => setVet(x.target.value)} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('appt.address')}>{(id) => <input id={id} value={address} onChange={(x) => setAddress(x.target.value)} />}</Field>
          <Field label={t('appt.phone')}>{(id) => <input id={id} type="tel" value={phone} onChange={(x) => setPhone(x.target.value)} />}</Field>
        </div>
        <Field label={t('appt.remind')}>{(id) => <select id={id} value={remind} onChange={(x) => setRemind(x.target.value)}>
          <option value="">{t('appt.remind.none')}</option><option value="60">{t('appt.remind.60')}</option><option value="1440">{t('appt.remind.1440')}</option><option value="2880">{t('appt.remind.2880')}</option></select>}</Field>
        <Field label={t('common.notes')}>{(id) => <textarea id={id} rows={2} value={notes} onChange={(x) => setNotes(x.target.value)} />}</Field>
      </>}
    </FormShell>
  )
}

export function ActivityForm({ type: initial = 'walk', onClose }: { type?: ActivityType; onClose: () => void }) {
  const { t, save, dogId } = useApp()
  const [type, setType] = useState<ActivityType>(initial); const [min, setMin] = useState(initial === 'walk' ? '30' : '')
  const [date, setDate] = useState(today()); const [notes, setNotes] = useState('')
  return (
    <FormShell title={t('activity.title')} onClose={onClose} onSubmit={async () => {
      const m = num(min); const e: Errors = {}
      if (type !== 'observation' && !(m > 0 && m <= 1440)) e.min = t('common.invalidNumber')
      if (type === 'observation' && !notes.trim()) e.notes = t('common.required')
      if (Object.keys(e).length) return e
      await save('activities', { dog_id: dogId!, date, type, minutes: type === 'observation' ? 0 : Math.round(m), notes: notes.trim() })
    }}>
      {(e) => <>
        <Field label={t('activity.type')}>{(id) => <select id={id} value={type} onChange={(x) => setType(x.target.value as ActivityType)}>{(['walk', 'play', 'training', 'observation', 'other'] as const).map((a) => <option key={a} value={a}>{t(`activity.${a}` as any)}</option>)}</select>}</Field>
        <div className="grid grid-cols-2 gap-3">
          {type !== 'observation' && <Field label={t('activity.minutes')} error={e.min}>{(id) => <input id={id} inputMode="numeric" value={min} onChange={(x) => setMin(x.target.value)} />}</Field>}
          <Field label={t('common.date')}>{(id) => <input id={id} type="date" max={today()} value={date} onChange={(x) => setDate(x.target.value)} />}</Field>
        </div>
        <Field label={t('common.notes')} error={e.notes}>{(id) => <textarea id={id} rows={2} value={notes} onChange={(x) => setNotes(x.target.value)} />}</Field>
      </>}
    </FormShell>
  )
}

export function MealForm({ onClose }: { onClose: () => void }) {
  const { t, save, dogId } = useApp()
  const now = new Date(); const hh = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const [time, setTime] = useState(hh); const [kind, setKind] = useState(''); const [product, setProduct] = useState(''); const [grams, setGrams] = useState(''); const [appetite, setAppetite] = useState('')
  return (
    <FormShell title={t('quick.meal')} onClose={onClose} onSubmit={async () => {
      const g = grams ? num(grams) : null; const e: Errors = {}
      if (g != null && !(g > 0 && g < 5000)) e.grams = t('common.invalidNumber')
      if (Object.keys(e).length) return e
      await save('meals', { dog_id: dogId!, at: `${today()}T${time}`, kind: kind.trim(), product: product.trim(), grams: g, appetite: appetite.trim() })
    }}>
      {(e) => <>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('meal.time')}>{(id) => <input id={id} type="time" value={time} onChange={(x) => setTime(x.target.value)} />}</Field>
          <Field label={t('meal.grams')} error={e.grams}>{(id) => <input id={id} inputMode="numeric" value={grams} onChange={(x) => setGrams(x.target.value)} />}</Field>
        </div>
        <Field label={t('meal.kind')}>{(id) => <input id={id} value={kind} onChange={(x) => setKind(x.target.value)} />}</Field>
        <Field label={t('meal.product')}>{(id) => <input id={id} value={product} onChange={(x) => setProduct(x.target.value)} />}</Field>
        <Field label={t('meal.appetite')}>{(id) => <input id={id} value={appetite} onChange={(x) => setAppetite(x.target.value)} />}</Field>
        <p className="text-xs text-muted">{t('meal.noRation')}</p>
      </>}
    </FormShell>
  )
}

export function RoutineForm({ onClose }: { onClose: () => void }) {
  const { t, save, dogId } = useApp(); const [label, setLabel] = useState('')
  return (
    <FormShell title={t('activity.routineAdd')} onClose={onClose} onSubmit={async () => {
      if (!label.trim()) return { label: t('common.required') }
      await save('routines', { dog_id: dogId!, label: label.trim(), enabled: true, done_dates: [] })
    }}>
      {(e) => <Field label={t('activity.routineLabel')} error={e.label}>{(id) => <input id={id} autoFocus value={label} onChange={(x) => setLabel(x.target.value)} />}</Field>}
    </FormShell>
  )
}
