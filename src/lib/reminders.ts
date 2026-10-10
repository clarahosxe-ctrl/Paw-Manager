import type { Appointment, Dog } from './types'
import { parseLocalDateTime } from './dates'

export const notificationState = (): 'granted' | 'denied' | 'default' | 'unsupported' =>
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

/** Appointments whose reminder time has passed (and the appointment has not) and that were not notified yet. */
export function dueReminders(appts: Appointment[], now = new Date(), seen: Set<string>) {
  return appts.filter((a) => {
    if (a.remind_minutes == null || seen.has(a.id)) return false
    const start = parseLocalDateTime(a.at).getTime()
    return now.getTime() >= start - a.remind_minutes * 60000 && now.getTime() < start
  })
}

const SEEN = 'pawmanager:notified'
export function checkAndNotify(appts: Appointment[], dogs: Dog[], title: (a: Appointment, dogName: string) => string, body: (a: Appointment) => string) {
  if (notificationState() !== 'granted') return
  let seen = new Set<string>()
  try { seen = new Set(JSON.parse(localStorage.getItem(SEEN) ?? '[]')) } catch { /* ignore */ }
  const due = dueReminders(appts, new Date(), seen)
  for (const a of due) {
    new Notification(title(a, dogs.find((d) => d.id === a.dog_id)?.name ?? ''), { body: body(a), icon: '/icon.svg', tag: a.id })
    seen.add(a.id)
  }
  if (due.length) localStorage.setItem(SEEN, JSON.stringify([...seen].slice(-200)))
}
