import type { Collections, TableName, Row, Settings } from './types'
import { emptyCollections } from './types'
import { supabase } from './supabase'

/** One persistence interface, two real implementations. Nothing here simulates a cloud. */
export interface Repo {
  kind: 'local' | 'cloud'
  loadAll(): Promise<Collections>
  upsert<T extends TableName>(table: T, row: Row<T>): Promise<void>
  remove(table: TableName, id: string): Promise<void>
  loadSettings(): Promise<Partial<Settings>>
  saveSettings(s: Settings): Promise<void>
  wipe(): Promise<void>
}

const TABLES = Object.keys(emptyCollections()) as TableName[]

export function localRepo(userId: string): Repo {
  const key = `pawmanager:v1:${userId}`
  const read = (): { data: Collections; settings: Partial<Settings> } => {
    try { const raw = localStorage.getItem(key); if (raw) { const p = JSON.parse(raw); return { data: { ...emptyCollections(), ...p.data }, settings: p.settings ?? {} } } } catch { /* corrupted: start clean */ }
    return { data: emptyCollections(), settings: {} }
  }
  const write = (s: ReturnType<typeof read>) => localStorage.setItem(key, JSON.stringify(s))
  return {
    kind: 'local',
    async loadAll() { return read().data },
    async upsert(table, row) {
      const s = read(); const list = s.data[table] as { id: string }[]
      const i = list.findIndex((r) => r.id === row.id)
      if (i >= 0) list[i] = row; else list.push(row)
      write(s)
    },
    async remove(table, id) {
      const s = read()
      ;(s.data as any)[table] = (s.data[table] as { id: string }[]).filter((r) => r.id !== id)
      if (table === 'dogs') for (const t of TABLES) if (t !== 'dogs') (s.data as any)[t] = (s.data[t] as { dog_id: string }[]).filter((r) => r.dog_id !== id)
      write(s)
    },
    async loadSettings() { return read().settings },
    async saveSettings(settings) { const s = read(); s.settings = settings; write(s) },
    async wipe() { localStorage.removeItem(key) },
  }
}

/** Cloud repo: each table row is stored as (id, user_id, dog_id, data jsonb). RLS restricts rows to auth.uid(). */
export function cloudRepo(userId: string): Repo {
  const sb = supabase!
  const check = (e: { message: string } | null) => { if (e) throw new Error(e.message) }
  return {
    kind: 'cloud',
    async loadAll() {
      const out = emptyCollections()
      await Promise.all(TABLES.map(async (t) => {
        const { data, error } = await sb.from(t).select('id,data')
        check(error); (out as any)[t] = (data ?? []).map((r: any) => ({ ...r.data, id: r.id }))
      }))
      return out
    },
    async upsert(table, row) {
      const { id, ...data } = row as any
      const { error } = await sb.from(table).upsert({ id, user_id: userId, dog_id: table === 'dogs' ? id : (row as any).dog_id, data })
      check(error)
    },
    async remove(table, id) { const { error } = await sb.from(table).delete().eq('id', id); check(error) },
    async loadSettings() { const { data, error } = await sb.from('profiles').select('settings').eq('id', userId).maybeSingle(); check(error); return (data?.settings as Partial<Settings>) ?? {} },
    async saveSettings(settings) { const { error } = await sb.from('profiles').upsert({ id: userId, settings }); check(error) },
    async wipe() { const { error } = await sb.rpc('delete_my_data'); check(error) },
  }
}

/** Demo repo: in-memory only, never touches storage. */
export function memoryRepo(seed: Collections): Repo {
  let data = structuredClone(seed)
  return {
    kind: 'local',
    async loadAll() { return structuredClone(data) },
    async upsert(t, row) { const l = data[t] as { id: string }[]; const i = l.findIndex((r) => r.id === row.id); if (i >= 0) l[i] = row; else l.push(row) },
    async remove(t, id) { (data as any)[t] = (data[t] as { id: string }[]).filter((r) => r.id !== id) },
    async loadSettings() { return {} }, async saveSettings() {}, async wipe() { data = emptyCollections() },
  }
}
