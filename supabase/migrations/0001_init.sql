-- PawManager schema. Every table: (id, user_id, dog_id, data jsonb) + Row Level Security by auth.uid().
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}',
  plan text not null default 'free' check (plan in ('free','premium')),   -- written ONLY by the billing webhook (service role)
  stripe_customer_id text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read"   on public.profiles for select using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid() and plan = 'free');
-- Users may update their settings but never their plan / stripe id:
create policy "own profile update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and plan = (select p.plan from public.profiles p where p.id = auth.uid()));

-- Generic owned-record tables
do $$
declare t text;
begin
  foreach t in array array['dogs','weights','expenses','health','appointments','activities','meals','routines'] loop
    execute format('create table public.%I (
      id text primary key,
      user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
      dog_id text not null,
      data jsonb not null default ''{}'',
      updated_at timestamptz not null default now()
    )', t);
    execute format('create index on public.%I (user_id, dog_id)', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows select" on public.%I for select using (user_id = auth.uid())', t);
    execute format('create policy "own rows insert" on public.%I for insert with check (user_id = auth.uid())', t);
    execute format('create policy "own rows update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "own rows delete" on public.%I for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- Server-side Free/Premium limit: free accounts may own at most 1 dog (change the number per offer).
create or replace function public.enforce_dog_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare p text; n int;
begin
  select plan into p from public.profiles where id = new.user_id;
  select count(*) into n from public.dogs where user_id = new.user_id;
  if coalesce(p,'free') = 'free' and n >= 1 then raise exception 'dog_limit_reached'; end if;
  return new;
end $$;
create trigger dogs_limit before insert on public.dogs for each row execute function public.enforce_dog_limit();

-- Documents bucket (private). Files live under <user_id>/<dog_id>/<file>.
insert into storage.buckets (id, name, public) values ('documents','documents', false) on conflict do nothing;
create policy "own files read"   on storage.objects for select using (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files write"  on storage.objects for insert with check (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete using (bucket_id='documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- GDPR: erase all my data in one call (rows only; the account itself is deleted from an Edge Function).
create or replace function public.delete_my_data() returns void language sql security definer set search_path = public as $$
  delete from public.dogs where user_id = auth.uid();
  delete from public.weights where user_id = auth.uid();
  delete from public.expenses where user_id = auth.uid();
  delete from public.health where user_id = auth.uid();
  delete from public.appointments where user_id = auth.uid();
  delete from public.activities where user_id = auth.uid();
  delete from public.meals where user_id = auth.uid();
  delete from public.routines where user_id = auth.uid();
$$;
