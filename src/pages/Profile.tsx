import { useState } from 'react'
import { useApp, PLAN_LIMITS } from '../state'
import { Avatar, Button, Card, Confirm, H, Pill } from '../components/ui'
import { DogForm } from '../components/forms'
import { LANGUAGES } from '../lib/i18n'
import { CURRENCIES } from '../lib/currency'
import { THEMES } from '../lib/themes'
import { notificationState } from '../lib/reminders'
import type { Dog } from '../lib/types'

export function Profile() {
  const { t, settings, updateSettings, data, dogId, setDogId, remove, plan, canAddDog, session, signOut, startDemo, wipeAll, notify } = useApp()
  const [form, setForm] = useState<null | { dog?: Dog }>(null); const [del, setDel] = useState<string | null>(null); const [wipe, setWipe] = useState(false)
  const [perm, setPerm] = useState(notificationState())
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), settings, data }, null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'pawmanager-export.json' }); a.click(); URL.revokeObjectURL(a.href)
  }
  const ask = async () => { setPerm((await Notification.requestPermission()) as any) }
  const permText = { granted: t('profile.reminders.granted'), denied: t('profile.reminders.denied'), unsupported: t('profile.reminders.unsupported'), default: '' }[perm]
  return (
    <div className="space-y-4">
      <h1 className="text-2xl">{t('profile.title')}</h1>
      <Card className="space-y-4">
        <div><label htmlFor="nm" className="text-sm text-muted">{t('profile.name')}</label><input id="nm" defaultValue={settings.display_name} onBlur={(e) => updateSettings({ display_name: e.target.value.trim() })} /></div>
        <div><label htmlFor="lg" className="text-sm text-muted">{t('profile.language')}</label><select id="lg" value={settings.language} onChange={(e) => updateSettings({ language: e.target.value })}>{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
        <div><label htmlFor="cu" className="text-sm text-muted">{t('profile.currency')}</label><select id="cu" value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
        <div><p className="mb-2 text-sm text-muted">{t('profile.theme')}</p>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={t('profile.theme')}>{THEMES.map((th) => (
            <button key={th.id} role="radio" aria-checked={settings.theme === th.id} onClick={() => updateSettings({ theme: th.id })} className={`flex flex-col items-center gap-1 text-xs ${settings.theme === th.id ? 'font-semibold' : 'text-muted'}`}>
              <span className={`flex h-12 w-12 overflow-hidden rounded-full border-2 ${settings.theme === th.id ? 'border-primary' : 'border-line'}`}><span className="w-1/2" style={{ background: `rgb(${th.vars.bg})` }} /><span className="w-1/2" style={{ background: `rgb(${th.vars.primary})` }} /></span>{th.label}</button>))}</div></div>
      </Card>

      <Card><H right={canAddDog ? <button className="text-sm text-primary underline" onClick={() => setForm({})}>{t('dog.add')}</button> : undefined}>{t('profile.dogs')}</H>
        <ul className="space-y-2">{data.dogs.map((d) => <li key={d.id} className="flex items-center gap-3"><Avatar name={d.name} /><button className="min-w-0 flex-1 truncate text-left" onClick={() => setDogId(d.id)}>{d.name}{d.id === dogId && <Pill tone="ok"> ✓</Pill>}</button>
          <button className="text-sm text-primary underline" onClick={() => setForm({ dog: d })}>{t('common.edit')}</button><button aria-label={t('common.delete')} className="text-muted" onClick={() => setDel(d.id)}>×</button></li>)}</ul>
        {!canAddDog && session?.mode !== 'demo' && <p className="mt-3 text-xs text-muted">{t('dog.limit', { n: PLAN_LIMITS[plan].dogs })}</p>}</Card>

      <Card><H>{t('profile.plan')}</H><p><Pill tone={plan === 'premium' ? 'ok' : 'sage'}>{plan === 'premium' ? t('profile.plan.premium') : t('profile.plan.free')}</Pill></p><p className="mt-2 text-xs text-muted">{t('profile.premiumSoon')}</p></Card>

      <Card><H>{t('profile.reminders')}</H>
        {perm === 'default' ? <Button variant="ghost" className="w-full" onClick={ask}>{t('profile.reminders.enable')}</Button> : <p className="text-sm">{permText}</p>}
        <p className="mt-2 text-xs text-muted">{t('profile.reminders.note')}</p></Card>

      <Card className="space-y-2"><p className="text-sm text-muted">{t('profile.storage')} : {session?.mode === 'cloud' ? t('profile.storage.cloud') : t('profile.storage.local')}{session?.email && ` · ${session.email}`}</p>
        {session?.mode !== 'demo' && <Button variant="ghost" className="w-full" onClick={exportData}>{t('profile.exportData')}</Button>}
        {session?.mode === 'local' && <Button variant="ghost" className="w-full" onClick={startDemo}>{t('profile.startDemo')}</Button>}
        {session?.mode !== 'demo' && <Button variant="ghost" className="w-full text-warn" onClick={() => setWipe(true)}>{t('profile.deleteData')}</Button>}
        <Button variant="ghost" className="w-full" onClick={signOut}>{session?.mode === 'demo' ? t('demo.exit') : t('auth.signout')}</Button></Card>

      {form && <DogForm dog={form.dog} onClose={() => setForm(null)} />}
      {del && <Confirm text={t('common.confirmDelete')} onNo={() => setDel(null)} onYes={async () => { await remove('dogs', del); setDel(null) }} />}
      {wipe && <Confirm text={t('profile.deleteConfirm')} onNo={() => setWipe(false)} onYes={async () => { await wipeAll(); setWipe(false); notify(t('common.deleted')) }} />}
    </div>
  )
}
