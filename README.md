# Que memória?
Jogo da memória multiplayer, com a mesma identidade visual do Entre Brisas. Alguém cria uma sala escolhendo a quantidade de peças, o tema das cartas e o tempo por vez; os amigos entram com o código. Na sua vez, vire duas cartas: achou um par, ganha o ponto e joga de novo; errou, passa a vez. Quem juntar mais pares vence.

## Rodando

1. Rode `supabase/schema.sql` no SQL Editor do Supabase (cria as tabelas `que_memoria_*`, no mesmo projeto Supabase dos outros jogos).
2. Rode `supabase/temas-emoji.sql` (cadastra os 6 temas de emoji).
3. Configure `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. `npm install` e `npm run dev`.

Temas com arte (aquarela): veja `temas/LEIA-ME.md`.
