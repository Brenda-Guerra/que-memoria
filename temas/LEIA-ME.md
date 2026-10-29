# Kit de artes dos temas

Cada tema de arte é uma pasta aqui dentro:

```
temas/
  cidades/
    tema.json      ← lista das cartas: nome na carta + o que desenhar
    prompts.txt    ← gerado: um prompt por carta, para colar no gerador
    prompts.csv    ← gerado: arquivo;prompt, para gerar em lote
    artes/         ← as imagens prontas, uma por carta: <slug>.png (ou .webp/.jpg)
  brasil/
    ...
```

## Passo a passo

1. **Revise o `tema.json`.** Cada item tem:
   - `slug`: nome do arquivo da arte (`toquio` → `artes/toquio.png`);
   - `nome`: o texto que vai pintado na carta;
   - `referencia`: o que é, em inglês, para o gerador entender (ex.: `Tokyo, Japan`);
   - `elementos`: o que torna aquele item inconfundível frente aos outros.
2. **Gere os prompts:** `node scripts/gerar-prompts.mjs cidades`
3. **Gere as imagens** (veja as dicas abaixo) e salve cada uma em `artes/<slug>.png`.
4. **Confira o que falta:** `node scripts/subir-tema.mjs cidades --simular`
5. **Suba para o jogo:** `node --env-file=.env.local scripts/subir-tema.mjs cidades`
   - Precisa da chave secreta no `.env.local`: `SUPABASE_SECRET_KEY=sb_secret_...`
     (Supabase → Project Settings → API Keys → Secret keys). Nunca use `NEXT_PUBLIC_` nela.
   - Pode rodar quantas vezes quiser: a arte refeita substitui a antiga, e o tema
     entra no jogo com as cartas que já têm arte (mínimo 2).

## Prompt-mestre (estilo único de todos os temas)

Fica em `scripts/gerar-prompts.mjs`, na função `montarPrompt`. Mudou lá, mudou para
todos os temas. Os campos entre chaves vêm do `tema.json`:

```
Watercolor illustration for a memory-game card, vertical 4:5 format (1024x1280).
Subject: {referencia}. Show the elements that make it instantly recognizable and set it
apart from any other {tipo}: {elementos}.
Composition: one iconic, centered scene in the upper 80% of the card, bold readable
silhouette that still works as a small thumbnail (about 120 px wide), simple background,
no clutter, generous margins.
Style: loose hand-painted watercolor on cold-press paper, soft wet-on-wet washes, visible
paper grain, gentle pigment blooms and bleeding edges, delicate thin outlines (no hard
black lines), harmonious palette of 3 to 5 main colors, warm soft daylight.
Background: plain, slightly yellowish warm cream paper (#F3EAD3); the painting fades
softly into the paper near the edges. No frame, no border.
Text: at the bottom, centered, only the name "{nome}" hand-lettered in watercolor brush
capital letters, same palette as the painting, spelled exactly like this (including
accents), fully inside the card with margin. No other text, letters, numbers or signs
anywhere in the image.
Keep the exact same paper color, brush technique, lettering style and lighting as the
rest of the set.
Avoid: photorealism, 3D render, digital gradients, thick black outlines, logos, brand
names, watermarks, signatures, borders, extra text, close-up portraits of people.
```

## Dicas para o kit sair igual

- **Comece por 4 ou 5 cartas** bem diferentes (ex.: Tóquio, Paris, Rio, Cairo, Nova York).
  Escolha a melhor e use-a como **imagem de referência de estilo** em todas as outras
  (ChatGPT/DALL·E: anexe a imagem e diga "same style as the attached card";
  Midjourney: `--sref <url>`; Leonardo/SDXL: style reference ou o mesmo seed).
- **Mesmo gerador, mesmo modelo, mesmas configurações** do começo ao fim do tema.
- **Confira a grafia do nome** em cada imagem. Acentos (Tóquio, Brasília) são onde os
  geradores mais erram: se errar, gere de novo só aquela carta. Ideogram e o gerador
  do ChatGPT costumam acertar mais o texto.
- **Tamanho para o jogo:** a carta aparece com até ~150 px de largura, então converta
  para **WebP de 600×750** (qualidade ~80). Fica com 40–90 KB cada e carrega rápido
  no celular. O Storage aceita até 2 MB por arquivo (webp, png, jpg, avif).
- Se uma carta ficar parecida demais com outra do mesmo tema, reforce no `elementos`
  o detalhe que só ela tem e gere de novo.

## Quantas cartas por tema

**Todo tema de arte tem 100 cartas.** Assim a coleção fica uniforme: qualquer tema
sorteia de um conjunto do mesmo tamanho, e nenhum repete mais que os outros (a maior
mesa usa 18 pares, então cada partida mostra só uma parte do tema).

O número fica em `CARTAS_POR_TEMA`, em `scripts/gerar-prompts.mjs`. O gerador de prompts
avisa se um `tema.json` tiver outra quantidade, e o envio mostra o progresso
("37 de 100 artes prontas"). Dá para subir o tema antes de terminar as 100: ele entra
no jogo com as que já têm arte.

Temas prontos para gerar (100 cartas cada, prompts já gerados em `prompts.txt`):

| Tema | Pasta | Enquadramento |
|---|---|---|
| Cidades | `temas/cidades` | cena com os marcos da cidade |
| Destinos do Brasil | `temas/brasil` | cena com os marcos do lugar |
| Países | `temas/paises` | marco + símbolos culturais |
| Animais | `temas/animais` | o animal de corpo inteiro no seu habitat |
| Flores | `temas/flores` | uma flor (ou cacho) com caule e folhas |
| Raças de cachorro | `temas/racas-de-cachorro` | o cão de corpo inteiro, proporções da raça |
| Raças de gatos | `temas/racas-de-gatos` | o gato de corpo inteiro, cabeça/orelhas/pelagem da raça |
| Árvores | `temas/arvores` | a árvore inteira na paisagem |
| Fauna e flora brasileira | `temas/fauna-e-flora-brasileira` | o bicho ou a planta no bioma brasileiro |

Os temas não se repetem entre si: os bichos e plantas típicos do Brasil (onça, arara,
ipê, vitória-régia…) estão só em *Fauna e flora brasileira*, não em *Animais*,
*Flores* ou *Árvores*. A exceção são as 17 cidades brasileiras, que aparecem em
*Cidades* e em *Destinos do Brasil* com o mesmo prompt: gere uma vez e
copie o arquivo para as duas pastas.

O enquadramento de cada tema fica no campo `composicao` do `tema.json`; o resto do
estilo (aquarela, papel creme, nome pintado) é igual para todos.

**Raças de gatos** é o tema mais difícil: muitas raças são raras ou parecidas, e o
gerador pode não conhecer as mais novas (Elf, Dwelf, Kinkalow, Skookum, Lambkin,
Genetta, Bramble, Raas, Sam Sawet, Ussuri, Toybob). Para essas, a descrição em
`elementos` é o que guia o desenho; confira com fotos reais antes de aprovar.

Ao montar um tema novo, escolha um assunto que tenha **100 itens inconfundíveis**.
Assuntos pequenos (ex.: os 27 estados) não fecham a conta; amplie o recorte
(ex.: "Destinos do Brasil" em vez de "Estados").

## Criar um tema novo

Copie a pasta de um tema, troque `id` (letras minúsculas e hífen), `nome`, `tipo`
(como o gerador deve chamar a categoria em inglês: `country`, `animal`…), `cor`
(fundo das cartas encontradas), `capa` (slug da carta que vira a capa no seletor)
e a lista de `itens`. Depois siga o passo a passo.
