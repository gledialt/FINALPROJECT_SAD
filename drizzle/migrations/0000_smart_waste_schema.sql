
create type public.app_role as enum ('admin', 'petugas', 'masyarakat');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  whatsapp text,
  address text,
  rt_rw text,
  kelurahan text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.get_my_role()
returns public.app_role language sql stable security definer set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid()
  order by case role when 'admin' then 1 when 'petugas' then 2 else 3 end limit 1
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin profile update" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin profile delete" on public.profiles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create policy "own role read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admin role insert" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin role update" on public.user_roles for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin role delete" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Prevent users from changing their own is_active flag
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_active is distinct from old.is_active and not public.has_role(auth.uid(),'admin') then
    raise exception 'Hanya Admin yang dapat mengubah status akun';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, whatsapp, address, rt_rw, kelurahan)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'rt_rw',
    new.raw_user_meta_data->>'kelurahan');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'masyarakat');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  content text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.announcements to authenticated;
grant all on public.announcements to service_role;
alter table public.announcements enable row level security;
create policy "read published" on public.announcements for select to authenticated using (is_published or public.has_role(auth.uid(),'admin'));
create policy "admin write ann" on public.announcements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.processes (
  id uuid primary key default gen_random_uuid(),
  step_order int not null default 1,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.processes to authenticated;
grant all on public.processes to service_role;
alter table public.processes enable row level security;
create policy "read processes" on public.processes for select to authenticated using (true);
create policy "admin write processes" on public.processes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time,
  area text not null,
  notes text,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.schedules to authenticated;
grant all on public.schedules to service_role;
alter table public.schedules enable row level security;
create policy "read schedules" on public.schedules for select to authenticated using (true);
create policy "admin insert schedules" on public.schedules for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin/petugas update schedules" on public.schedules for update to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'petugas'));
create policy "admin delete schedules" on public.schedules for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  description text,
  latitude double precision,
  longitude double precision,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.locations to authenticated;
grant all on public.locations to service_role;
alter table public.locations enable row level security;
create policy "read locations" on public.locations for select to authenticated using (true);
create policy "admin write locations" on public.locations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.processes (step_order, title, description) values
 (1, 'Pengumpulan', 'Sampah rumah tangga dipilah dan dikumpulkan oleh warga di titik pengumpulan.'),
 (2, 'Pengangkutan', 'Petugas kebersihan mengangkut sampah sesuai jadwal pengangkutan wilayah.'),
 (3, 'Pengolahan', 'Sampah diolah atau diproses lebih lanjut di lokasi pengelolaan akhir.');

insert into public.locations (name, address, description, latitude, longitude, is_verified) values
 ('TPA Airmadidi', 'Airmadidi, Minahasa Utara, Sulawesi Utara', 'Tempat pemrosesan akhir sampah.', 1.4113469, 124.9645495, true),
 ('RW 10 Airmadidi Atas', 'Airmadidi Atas, Minahasa Utara', 'Titik koordinat belum dikonfirmasi.', null, null, false);
