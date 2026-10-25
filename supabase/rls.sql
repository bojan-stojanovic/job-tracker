-- Ownership: every child row points at auth.users, so deleting a user
-- removes their data.
alter table public.applications
  add constraint applications_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.contacts
  add constraint contacts_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.interactions
  add constraint interactions_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.application_status_events
  add constraint status_events_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Enable RLS. Without a policy, a table denies all access to the anon and
-- authenticated roles, so the default is closed.
alter table public.applications enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;
alter table public.application_status_events enable row level security;

-- Each signed-in user can read and write only rows where user_id matches
-- their own ID. The (select auth.uid()) form lets Postgres cache the value
-- per query instead of calling it for every row.
create policy "owner access" on public.applications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "owner access" on public.contacts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "owner access" on public.interactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "owner access" on public.application_status_events
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);