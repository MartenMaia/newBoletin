-- Enable extensions
create extension if not exists pgcrypto;

-- Single-tenant scaffolding (minimal for roles)
create table if not exists associacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table if not exists bairros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

-- Profiles / roles
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','operador','revisor')),
  associacao_id uuid null references associacoes(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Users can read own profile
drop policy if exists "profiles_read_own" on profiles;
create policy "profiles_read_own" on profiles
for select
to authenticated
using (user_id = auth.uid());

-- Admin check helper (SQL)
create or replace function is_admin() returns boolean
language sql stable as $$
  select exists(
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Balneabilidade tables
create table if not exists balneabilidade_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date unique not null,
  source_url text not null,
  checksum text not null,
  downloaded_at timestamptz,
  parsed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists balneabilidade_points (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  point_number int not null,
  balneario_name text not null,
  location_text text not null,
  bairro_id uuid null references bairros(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(city, point_number)
);

create table if not exists balneabilidade_samples (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references balneabilidade_points(id) on delete cascade,
  sample_date date not null,
  status text not null check (status in ('PROPRIA','IMPROPRIA','INDETERMINADO')),
  report_id uuid not null references balneabilidade_reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(point_id, sample_date)
);

-- Updated_at trigger
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bal_points_updated_at on balneabilidade_points;
create trigger trg_bal_points_updated_at
before update on balneabilidade_points
for each row execute function set_updated_at();

-- Indexes
create index if not exists idx_bal_samples_point_date on balneabilidade_samples(point_id, sample_date desc);
create index if not exists idx_bal_points_bairro on balneabilidade_points(bairro_id);

-- RLS
alter table balneabilidade_reports enable row level security;
alter table balneabilidade_points enable row level security;
alter table balneabilidade_samples enable row level security;

-- Readable by authenticated users
drop policy if exists "bal_reports_read_auth" on balneabilidade_reports;
create policy "bal_reports_read_auth" on balneabilidade_reports
for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "bal_points_read_auth" on balneabilidade_points;
create policy "bal_points_read_auth" on balneabilidade_points
for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "bal_samples_read_auth" on balneabilidade_samples;
create policy "bal_samples_read_auth" on balneabilidade_samples
for select
to authenticated
using (auth.uid() is not null);

-- Update mapping only by admin (bairro_id)
drop policy if exists "bal_points_admin_update" on balneabilidade_points;
create policy "bal_points_admin_update" on balneabilidade_points
for update
to authenticated
using (is_admin())
with check (is_admin());

-- No inserts/updates/deletes from anon/authenticated (Edge function uses service role bypass)

-- Seed bairros Florianópolis (idempotent by name)
insert into bairros (nome)
select v.nome from (
  values
  ('Abraão'),
  ('Agronômica'),
  ('Armação'),
  ('Barra da Lagoa'),
  ('Bom Abrigo'),
  ('Cachoeira do Bom Jesus'),
  ('Campeche'),
  ('Canasvieiras'),
  ('Capoeiras'),
  ('Centro'),
  ('Córrego Grande'),
  ('Costa da Lagoa'),
  ('Costeira do Pirajubaé'),
  ('Estreito'),
  ('Ingleses do Rio Vermelho'),
  ('Itacorubi'),
  ('Itaguaçu'),
  ('José Mendes'),
  ('João Paulo'),
  ('Jurerê'),
  ('Lagoa da Conceição'),
  ('Pântano do Sul'),
  ('Porto da Lagoa'),
  ('Praia Brava'),
  ('Ratones'),
  ('Ribeirão da Ilha'),
  ('Rio Vermelho'),
  ('Saco dos Limões'),
  ('Saco Grande'),
  ('Sambaqui'),
  ('Santo Antônio de Lisboa'),
  ('Trindade'),
  ('Tapera')
) as v(nome)
where not exists (select 1 from bairros b where b.nome = v.nome);
