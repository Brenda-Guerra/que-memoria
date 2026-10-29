-- Que memória? — tabelas do jogo
-- Rode no Supabase: Dashboard → SQL Editor → New query → cole e execute.
-- Pode rodar mais de uma vez sem problema.

create extension if not exists pgcrypto;

/* ------------------------------------------------------------------ */
/* Salas                                                               */
/* ------------------------------------------------------------------ */

create table if not exists public.que_memoria_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid,
  pairs int not null default 20 check (pairs between 2 and 50),
  theme text not null default 'bichos',
  turn_time int check (turn_time is null or turn_time > 0),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished')),
  current_player_id uuid,
  first_pick int,
  second_pick int,
  picked_at timestamptz,
  turn_number int not null default 0,
  moves int not null default 0,
  turn_started_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- Bancos criados antes das mesas grandes: atualiza o limite de pares
alter table public.que_memoria_rooms
  drop constraint if exists que_memoria_rooms_pairs_check;
alter table public.que_memoria_rooms
  add constraint que_memoria_rooms_pairs_check check (pairs between 2 and 50);
alter table public.que_memoria_rooms alter column pairs set default 20;

/* ------------------------------------------------------------------ */
/* Jogadores                                                           */
/* ------------------------------------------------------------------ */

create table if not exists public.que_memoria_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.que_memoria_rooms (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  player_order int,
  connected boolean not null default true,
  is_host boolean not null default false,
  joined_at timestamptz not null default now()
);

create index if not exists que_memoria_players_room_idx
  on public.que_memoria_players (room_id);

/* ------------------------------------------------------------------ */
/* Temas e itens (o que vai na frente das cartas)                      */
/* ------------------------------------------------------------------ */

-- Um tema é de emojis ('emoji') ou de artes ('image'). As artes ficam no
-- Storage (bucket que-memoria) e o item guarda só o caminho do arquivo.
create table if not exists public.que_memoria_themes (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  kind text not null default 'emoji' check (kind in ('emoji', 'image')),
  -- capa no seletor: um emoji ou uma imagem do Storage
  cover_emoji text,
  cover_path text,
  -- fundo das cartas já encontradas
  color text not null default '#fff3cb',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.que_memoria_theme_items (
  id uuid primary key default gen_random_uuid(),
  theme_id text not null
    references public.que_memoria_themes (id) on delete cascade on update cascade,
  slug text not null,
  name text not null,
  emoji text,
  image_path text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (theme_id, slug),
  check (emoji is not null or image_path is not null)
);

create index if not exists que_memoria_theme_items_theme_idx
  on public.que_memoria_theme_items (theme_id);

-- Temas com a contagem de itens ativos (limita as opções de peças)
create or replace view public.que_memoria_themes_resumo
with (security_invoker = true) as
select
  t.id, t.name, t.kind, t.cover_emoji, t.cover_path, t.color, t.sort_order,
  (
    select count(*)::int from public.que_memoria_theme_items i
    where i.theme_id = t.id and i.active
  ) as item_count
from public.que_memoria_themes t
where t.active;

/* ------------------------------------------------------------------ */
/* Cartas da mesa                                                      */
/* ------------------------------------------------------------------ */

create table if not exists public.que_memoria_cards (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.que_memoria_rooms (id) on delete cascade,
  position int not null,
  -- chave do par: as duas cartas de um par têm o mesmo symbol (id do item)
  symbol text not null,
  matched_by uuid references public.que_memoria_players (id) on delete set null,
  matched_at timestamptz,
  unique (room_id, position)
);

-- Cópia do item na carta: a partida não depende do tema mudar depois
alter table public.que_memoria_cards add column if not exists label text;
alter table public.que_memoria_cards add column if not exists emoji text;
alter table public.que_memoria_cards add column if not exists image_url text;

create index if not exists que_memoria_cards_room_idx
  on public.que_memoria_cards (room_id);

/* ------------------------------------------------------------------ */
/* Storage: arquivos das artes (blobs)                                 */
/* ------------------------------------------------------------------ */

-- Bucket público para leitura (as cartas carregam pela URL pública).
-- Envio só com a chave secreta (script scripts/subir-tema.mjs).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'que-memoria',
  'que-memoria',
  true,
  2097152, -- 2 MB por arquivo
  array['image/webp', 'image/png', 'image/jpeg', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

/* ------------------------------------------------------------------ */
/* Acesso (jogo casual, sem login: qualquer um com o código joga)      */
/* ------------------------------------------------------------------ */

-- projetos novos do Supabase não liberam tabelas novas para a chave pública
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table
  public.que_memoria_rooms, public.que_memoria_players, public.que_memoria_cards
  to anon, authenticated;

alter table public.que_memoria_rooms enable row level security;
alter table public.que_memoria_players enable row level security;
alter table public.que_memoria_cards enable row level security;

drop policy if exists "que_memoria_rooms_publico" on public.que_memoria_rooms;
create policy "que_memoria_rooms_publico" on public.que_memoria_rooms
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "que_memoria_players_publico" on public.que_memoria_players;
create policy "que_memoria_players_publico" on public.que_memoria_players
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "que_memoria_cards_publico" on public.que_memoria_cards;
create policy "que_memoria_cards_publico" on public.que_memoria_cards
  for all to anon, authenticated using (true) with check (true);

-- Temas: o jogo só lê. Quem cadastra é o script, com a chave secreta.
grant select on table
  public.que_memoria_themes, public.que_memoria_theme_items,
  public.que_memoria_themes_resumo
  to anon, authenticated;
grant select, insert, update, delete on table
  public.que_memoria_themes, public.que_memoria_theme_items
  to service_role;

alter table public.que_memoria_themes enable row level security;
alter table public.que_memoria_theme_items enable row level security;

drop policy if exists "que_memoria_themes_leitura" on public.que_memoria_themes;
create policy "que_memoria_themes_leitura" on public.que_memoria_themes
  for select to anon, authenticated using (active);

drop policy if exists "que_memoria_theme_items_leitura" on public.que_memoria_theme_items;
create policy "que_memoria_theme_items_leitura" on public.que_memoria_theme_items
  for select to anon, authenticated using (active);

/* ------------------------------------------------------------------ */
/* Tempo real                                                          */
/* ------------------------------------------------------------------ */

-- DELETE filtrado por room_id precisa da linha antiga inteira
alter table public.que_memoria_players replica identity full;
alter table public.que_memoria_cards replica identity full;

do $$
declare
  tabela text;
begin
  foreach tabela in array array['que_memoria_rooms', 'que_memoria_players', 'que_memoria_cards']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tabela
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tabela);
    end if;
  end loop;
end $$;
