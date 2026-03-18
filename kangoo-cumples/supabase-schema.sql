-- KangooCumples — Supabase schema
-- Ejecutá este SQL en el SQL Editor de tu proyecto Supabase

-- Tabla principal de eventos (cumpleaños)
create table if not exists public.eventos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  fecha       date not null,
  descripcion text,
  emoji       text default '🎂',
  categoria   text default 'personal',
  created_at  timestamptz default now()
);

-- Tabla de configuración (clave-valor JSON)
create table if not exists public.config (
  clave  text primary key,
  valor  jsonb not null,
  updated_at timestamptz default now()
);

-- Habilitar RLS (Row Level Security)
alter table public.eventos enable row level security;
alter table public.config  enable row level security;

-- Políticas: acceso público de lectura/escritura (ajustá según tu auth)
create policy "allow all eventos" on public.eventos for all using (true) with check (true);
create policy "allow all config"  on public.config  for all using (true) with check (true);
