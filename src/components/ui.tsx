import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useApp } from '../state'

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <section className={`rounded-card bg-card p-5 shadow-soft ${className}`}>{children}</section>

export const H = ({ children, right }: { children: ReactNode; right?: ReactNode }) =>
  <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-lg">{children}</h2>{right}</div>

type BP = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }
export function Button({ variant = 'primary', className = '', ...p }: BP) {
  const v = { primary: 'bg-primary text-onprimary', ghost: 'bg-bg text-ink border border-line', danger: 'bg-warn text-white' }[variant]
  return <button {...p} className={`min-h-12 rounded-btn px-5 font-medium transition active:scale-[.98] disabled:opacity-50 ${v} ${className}`} />
}

export function Field({ label, error, children, hint }: { label: string; error?: string; children: (id: string) => ReactNode; hint?: string }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-muted">{label}</label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="text-sm text-warn">{error}</p>}
    </div>
  )
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useApp()
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="rise max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-bg p-5 pb-safe md:rounded-[28px]">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl">{title}</h2>
          <button onClick={onClose} aria-label={t('common.close')} className="h-10 w-10 rounded-full bg-card text-lg">×</button></div>
        {children}
      </div>
    </div>
  )
}

export const Empty = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) =>
  <div className="rounded-card border border-dashed border-line p-6 text-center"><p className="font-medium">{title}</p>{hint && <p className="mt-1 text-sm text-muted">{hint}</p>}{action && <div className="mt-4">{action}</div>}</div>

export function Ring({ value, label, sub }: { value: number | null; label: string; sub?: string }) {
  const r = 52, c = 2 * Math.PI * r, v = value ?? 0
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`${label}: ${value ?? ''}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="10" />
        {value != null && <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(var(--primary))" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        <span className="font-display text-2xl">{label}</span>{sub && <span className="text-[11px] leading-tight text-muted">{sub}</span>}
      </div>
    </div>
  )
}

export const Pill = ({ children, tone = 'sage' }: { children: ReactNode; tone?: 'sage' | 'warn' | 'ok' }) =>
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone === 'warn' ? 'bg-warn/15 text-warn' : tone === 'ok' ? 'bg-ok/15 text-ok' : 'bg-sage/30 text-ink'}`}>{children}</span>

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-sage/50 font-display text-primary" aria-hidden>{name.trim().slice(0, 1).toUpperCase() || '🐾'}</div>
}

export function Confirm({ onYes, onNo, text }: { onYes: () => void; onNo: () => void; text: string }) {
  const { t } = useApp()
  return <Sheet title={t('common.delete')} onClose={onNo}><p className="mb-5">{text}</p>
    <div className="flex gap-3"><Button variant="ghost" className="flex-1" onClick={onNo}>{t('common.cancel')}</Button><Button variant="danger" className="flex-1" onClick={onYes}>{t('common.delete')}</Button></div></Sheet>
}
