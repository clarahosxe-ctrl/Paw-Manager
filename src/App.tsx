import { useEffect, useState } from 'react'
import { useApp } from './state'
import { Auth } from './pages/Auth'
import { Home } from './pages/Home'
import { Health } from './pages/Health'
import { Activity } from './pages/Activity'
import { Expenses } from './pages/Expenses'
import { Profile } from './pages/Profile'
import { Avatar, Button, Sheet } from './components/ui'
import { DogForm } from './components/forms'
import { checkAndNotify } from './lib/reminders'
import { fmtDateTime } from './lib/dates'

const TABS = [['home', '🏠', 'nav.home'], ['health', '🩺', 'nav.health'], ['activity', '🦮', 'nav.activity'], ['expenses', '💶', 'nav.expenses'], ['profile', '👤', 'nav.profile']] as const
type Tab = (typeof TABS)[number][0]
const fromHash = (): Tab => (TABS.find(([k]) => `#${k}` === location.hash)?.[0] ?? 'home')

export function App() {
  const { ready, session, t, data, dog, setDogId, canAddDog, toast, error, locale, settings } = useApp()
  const [tab, setTabState] = useState<Tab>(fromHash)
  const [dogForm, setDogForm] = useState(false); const [picker, setPicker] = useState(false)
  const setTab = (x: string) => { location.hash = x; setTabState(x as Tab) }
  useEffect(() => { const h = () => setTabState(fromHash()); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  // Real browser notifications (only if permission granted); checked while the app is open.
  useEffect(() => {
    if (!session || session.mode === 'demo') return
    const run = () => checkAndNotify(data.appointments, data.dogs, (a, n) => `${n} · ${a.reason}`, (a) => fmtDateTime(a.at, locale))
    run(); const i = setInterval(run, 60000); return () => clearInterval(i)
  }, [session, data.appointments, data.dogs, locale, settings.language])

  if (!ready) return <p className="p-8 text-center text-muted">{t('common.loading')}</p>
  if (error && !session) return <p role="alert" className="p-8 text-center text-warn">{error}</p>
  if (!session) return <Auth />

  return (
    <div className="mx-auto flex min-h-full max-w-6xl md:gap-6 md:px-6">
      <nav aria-label="Navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-safe backdrop-blur md:sticky md:top-0 md:inset-auto md:h-screen md:w-56 md:shrink-0 md:border-0 md:border-r md:bg-transparent md:pt-8">
        <p className="mb-6 hidden px-3 font-display text-2xl md:block">🐾 PawManager</p>
        <ul className="flex md:block md:space-y-1">{TABS.map(([k, icon, label]) => (
          <li key={k} className="flex-1"><button onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}
            className={`flex w-full flex-col items-center gap-0.5 py-2 text-[11px] md:flex-row md:gap-3 md:rounded-btn md:px-3 md:py-3 md:text-sm ${tab === k ? 'font-semibold text-primary md:bg-card' : 'text-muted'}`}><span className="text-xl md:text-base" aria-hidden>{icon}</span>{t(label)}</button></li>))}</ul>
      </nav>
      <main className="min-w-0 flex-1 px-4 pb-28 pt-4 md:pb-10 md:pt-8">
        {session.mode === 'demo' && <div className="mb-3 flex items-center justify-between gap-2 rounded-btn bg-sage/40 px-4 py-2 text-xs"><span>{t('demo.banner')}</span></div>}
        {session.mode === 'local' && <div className="mb-3 rounded-btn bg-card px-4 py-2 text-xs text-muted">{t('local.banner')}</div>}
        {error && <p role="alert" className="mb-3 rounded-btn bg-warn/15 px-4 py-2 text-sm text-warn">{error}</p>}
        {data.dogs.length > 0 && <button onClick={() => setPicker(true)} className="mb-4 flex items-center gap-2 rounded-full bg-card py-1 pl-1 pr-4 text-sm" aria-label={t('dog.switch')}><Avatar name={dog?.name ?? ''} size={32} />{dog?.name} ▾</button>}
        {tab === 'home' && <Home go={setTab} openDog={() => setDogForm(true)} />}
        {tab === 'health' && <Health />}
        {tab === 'activity' && <Activity />}
        {tab === 'expenses' && <Expenses />}
        {tab === 'profile' && <Profile />}
      </main>
      {picker && <Sheet title={t('dog.switch')} onClose={() => setPicker(false)}><ul className="space-y-2">{data.dogs.map((d) => <li key={d.id}><button className="flex w-full items-center gap-3 rounded-btn bg-card p-3 text-left" onClick={() => { setDogId(d.id); setPicker(false) }}><Avatar name={d.name} />{d.name}</button></li>)}</ul>
        {canAddDog && <Button className="mt-4 w-full" onClick={() => { setPicker(false); setDogForm(true) }}>{t('dog.add')}</Button>}</Sheet>}
      {dogForm && <DogForm onClose={() => setDogForm(false)} />}
      {toast && <div role="status" className="rise fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-primary px-5 py-2 text-sm text-onprimary shadow-soft md:bottom-8">{toast}</div>}
    </div>
  )
}
