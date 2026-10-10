import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Collections, Plan, Row, Settings, TableName } from './lib/types'
import { emptyCollections } from './lib/types'
import { cloudRepo, localRepo, memoryRepo, type Repo } from './lib/repo'
import { demoData } from './lib/seed'
import { cloudConfigured, supabase } from './lib/supabase'
import { makeT, localeOf, type TFn } from './lib/i18n'
import { applyTheme } from './lib/themes'
import { formatMoney } from './lib/currency'
import { uid } from './lib/dates'

export type Mode = 'cloud' | 'local' | 'demo'
interface Session { mode: Mode; userId: string; email?: string }

export const PLAN_LIMITS: Record<Plan, { dogs: number }> = { free: { dogs: 1 }, premium: { dogs: Infinity } }
const DEFAULT_SETTINGS: Settings = { language: 'fr', currency: 'EUR', theme: 'olive', budget_monthly: null, display_name: '' }
const SESSION_KEY = 'pawmanager:session'

interface Ctx {
  ready: boolean
  session: Session | null
  data: Collections
  settings: Settings
  plan: Plan
  t: TFn
  locale: string
  money: (n: number) => string
  dogId: string | null
  dog: Collections['dogs'][number] | null
  setDogId: (id: string) => void
  save: <T extends TableName>(table: T, row: Omit<Row<T>, 'id'> & { id?: string }) => Promise<string>
  remove: (table: TableName, id: string) => Promise<void>
  updateSettings: (p: Partial<Settings>) => Promise<void>
  startLocal: () => void
  startDemo: () => void
  signOut: () => Promise<void>
  wipeAll: () => Promise<void>
  canAddDog: boolean
  toast: string | null
  notify: (m: string) => void
  error: string | null
}
const C = createContext<Ctx>(null as never)
export const useApp = () => useContext(C)

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<Collections>(emptyCollections())
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [plan, setPlan] = useState<Plan>('free')
  const [dogId, setDogIdState] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const repo = useRef<Repo | null>(null)
  const inflight = useRef(new Set<string>()) // duplicate-submit guard

  const t = useMemo(() => makeT(settings.language), [settings.language])
  const locale = localeOf(settings.language)
  const money = useCallback((n: number) => formatMoney(n, settings.currency, locale), [settings.currency, locale])
  const notify = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }, [])

  useEffect(() => { applyTheme(settings.theme); document.documentElement.lang = settings.language }, [settings.theme, settings.language])

  const load = useCallback(async (s: Session) => {
    setReady(false); setError(null)
    try {
      const r = s.mode === 'demo' ? memoryRepo(demoData()) : s.mode === 'cloud' ? cloudRepo(s.userId) : localRepo(s.userId)
      repo.current = r
      const [d, st] = await Promise.all([r.loadAll(), r.loadSettings()])
      setData(d); if (s.mode !== 'demo') setSettings({ ...DEFAULT_SETTINGS, ...st, display_name: st.display_name ?? '' })
      setDogIdState(d.dogs[0]?.id ?? null)
      if (s.mode === 'cloud') {
        const { data: p } = await supabase!.from('profiles').select('plan').eq('id', s.userId).maybeSingle()
        setPlan((p?.plan as Plan) ?? 'free')
      } else setPlan('free')
      setSession(s)
    } catch (e: any) { setError(e.message ?? String(e)) } finally { setReady(true) }
  }, [])

  // Restore session on boot
  useEffect(() => {
    (async () => {
      if (supabase) {
        const { data: { session: ss } } = await supabase.auth.getSession()
        if (ss) { await load({ mode: 'cloud', userId: ss.user.id, email: ss.user.email }); return }
        supabase.auth.onAuthStateChange((_e, s2) => { if (!s2) { setSession(null) } })
      }
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw === 'local') await load({ mode: 'local', userId: 'device' })
      else setReady(true)
    })()
  }, [load])

  const startLocal = () => { localStorage.setItem(SESSION_KEY, 'local'); void load({ mode: 'local', userId: 'device' }) }
  const startDemo = () => void load({ mode: 'demo', userId: 'demo' })
  const signOut = async () => {
    if (session?.mode === 'cloud') await supabase!.auth.signOut()
    localStorage.removeItem(SESSION_KEY); setSession(null); setData(emptyCollections())
  }

  const save: Ctx['save'] = async (table, row) => {
    const id = (row as any).id ?? uid()
    const full = { ...row, id } as Row<typeof table>
    if (inflight.current.has(id)) return id
    inflight.current.add(id)
    try {
      await repo.current!.upsert(table, full)
      setData((d) => { const l = (d[table] as { id: string }[]); const i = l.findIndex((r) => r.id === id); const nl = i >= 0 ? l.map((r, k) => (k === i ? full : r)) : [...l, full]; return { ...d, [table]: nl } as Collections })
      if (table === 'dogs') setDogIdState((cur) => cur ?? id)
      notify(t('common.saved'))
      return id
    } catch (e: any) { setError(e.message); throw e } finally { inflight.current.delete(id) }
  }
  const remove: Ctx['remove'] = async (table, id) => {
    await repo.current!.remove(table, id)
    setData((d) => {
      const next = { ...d, [table]: (d[table] as { id: string }[]).filter((r) => r.id !== id) } as Collections
      if (table === 'dogs') for (const k of Object.keys(next) as TableName[]) if (k !== 'dogs') (next as any)[k] = (next[k] as { dog_id: string }[]).filter((r) => r.dog_id !== id)
      return next
    })
    if (table === 'dogs') setDogIdState((cur) => (cur === id ? data.dogs.find((x) => x.id !== id)?.id ?? null : cur))
    notify(t('common.deleted'))
  }
  const updateSettings = async (p: Partial<Settings>) => { const n = { ...settings, ...p }; setSettings(n); await repo.current?.saveSettings(n) }
  const wipeAll = async () => { await repo.current?.wipe(); setData(emptyCollections()); setDogIdState(null) }

  const dog = data.dogs.find((d) => d.id === dogId) ?? null
  const value: Ctx = {
    ready, session, data, settings, plan, t, locale, money, dogId, dog,
    setDogId: setDogIdState, save, remove, updateSettings, startLocal, startDemo, signOut, wipeAll,
    canAddDog: data.dogs.length < PLAN_LIMITS[plan].dogs && session?.mode !== 'demo', toast, notify, error,
  }
  return <C.Provider value={value}>{children}</C.Provider>
}
export { cloudConfigured }
