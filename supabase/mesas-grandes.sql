-- Que memória? — mesas de 40 a 100 cartas (até 50 pares)
-- Rode uma vez no Supabase: Dashboard → SQL Editor → New query → cole e execute.
-- Pode rodar mais de uma vez sem problema.

alter table public.que_memoria_rooms
  drop constraint if exists que_memoria_rooms_pairs_check;

alter table public.que_memoria_rooms
  add constraint que_memoria_rooms_pairs_check check (pairs between 2 and 50);

alter table public.que_memoria_rooms
  alter column pairs set default 20;
