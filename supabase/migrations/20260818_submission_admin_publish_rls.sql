-- QAL: allow administrators to review, score and publish submissions.
-- Run this migration in Supabase SQL Editor if your project has RLS enabled on public.submissions.

create or replace function public.is_qal_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'admin'
  );
$$;

revoke all on function public.is_qal_admin() from public;
grant execute on function public.is_qal_admin() to authenticated;

alter table public.submissions enable row level security;

drop policy if exists "Admins can update submissions" on public.submissions;
create policy "Admins can update submissions"
on public.submissions
for update
to authenticated
using (public.is_qal_admin())
with check (public.is_qal_admin());

-- Students may read their own submissions. This allows the published result
-- to appear on the Missions page while still preventing access to other users.
drop policy if exists "Users can read own submissions" on public.submissions;
create policy "Users can read own submissions"
on public.submissions
for select
to authenticated
using (user_id = auth.uid() or public.is_qal_admin());
