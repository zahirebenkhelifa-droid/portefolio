alter table public.profiles
  add column if not exists bio text not null default '',
  add column if not exists website text,
  add column if not exists updated_at timestamptz not null default now();

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

insert into public.profiles (id, display_name)
select users.id, coalesce(users.raw_user_meta_data ->> 'display_name', '')
from auth.users as users
on conflict (id) do nothing;