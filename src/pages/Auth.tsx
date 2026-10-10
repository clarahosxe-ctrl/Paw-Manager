import { useState } from 'react'
import { useApp, cloudConfigured } from '../state'
import { supabase } from '../lib/supabase'
import { Button, Card, Field } from '../components/ui'
import { LANGUAGES } from '../lib/i18n'

export function Auth() {
  const { t, startLocal, startDemo, updateSettings, settings } = useApp()
  const [mode, setMode] = useState<'in' | 'up'>('in'); const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const go = async () => {
    if (!supabase) return; setBusy(true); setMsg('')
    const r = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password: pw }) : await supabase.auth.signUp({ email, password: pw })
    setBusy(false)
    if (r.error) setMsg(r.error.message); else if (mode === 'up' && !r.data.session) setMsg(t('auth.checkEmail'))
    else location.reload()
  }
  const reset = async () => { if (!supabase || !email) return; await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); setMsg(t('auth.resetSent')) }
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-5 px-4 py-10">
      <div className="text-center"><div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl text-onprimary">🐾</div>
        <h1 className="text-3xl">PawManager</h1><p className="mt-1 text-muted">{t('app.tagline')}</p></div>
      <Card className="space-y-4">
        <h2 className="text-lg">{t('auth.welcome')}</h2>
        {cloudConfigured ? (<>
          <Field label={t('auth.email')}>{(id) => <input id={id} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
          <Field label={t('auth.password')}>{(id) => <input id={id} type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)} />}</Field>
          {msg && <p role="alert" className="text-sm text-warn">{msg}</p>}
          <Button className="w-full" disabled={busy || !email || pw.length < 6} onClick={go}>{mode === 'in' ? t('auth.signin') : t('auth.signup')}</Button>
          <div className="flex justify-between text-sm text-primary underline"><button onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? t('auth.signup') : t('auth.signin')}</button><button onClick={reset}>{t('auth.forgot')}</button></div>
        </>) : <p className="text-sm text-muted">{t('auth.cloudMissing')}</p>}
        <hr className="border-line" />
        <Button variant="ghost" className="w-full" onClick={startLocal}>{t('auth.localStart')}</Button>
        <Button variant="ghost" className="w-full" onClick={startDemo}>{t('auth.demoStart')}</Button>
      </Card>
      <div className="flex justify-center gap-2" role="group" aria-label="Language">
        {LANGUAGES.map((l) => <button key={l.code} onClick={() => updateSettings({ language: l.code })} aria-pressed={settings.language === l.code}
          className={`rounded-full px-3 py-1 text-sm ${settings.language === l.code ? 'bg-primary text-onprimary' : 'bg-card'}`}>{l.label}</button>)}
      </div>
    </main>
  )
}
