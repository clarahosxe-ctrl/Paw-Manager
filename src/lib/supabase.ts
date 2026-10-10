import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Only the public anon key belongs in the client. Access control is enforced by Row Level Security
// (see supabase/migrations/0001_init.sql). Never put a service-role key here.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const cloudConfigured = Boolean(url && key)
export const supabase: SupabaseClient | null = cloudConfigured ? createClient(url!, key!) : null
