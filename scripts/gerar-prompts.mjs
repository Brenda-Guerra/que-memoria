// Gera os prompts de imagem de um tema a partir de temas/<tema>/tema.json.
//
//   node scripts/gerar-prompts.mjs cidades
//
// Saída em temas/<tema>/:
//   prompts.txt  — um prompt por carta, para colar no gerador
//   prompts.csv  — arquivo;prompt, para geração em lote (API, planilha)

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Todo tema de arte tem o mesmo tamanho, para a coleção ficar uniforme. */
export const CARTAS_POR_TEMA = 100

/**
 * Estilo único do jogo: todas as cartas de todos os temas seguem este molde,
 * para o kit parecer uma coleção só. Mude aqui e todos os temas acompanham.
 */
export function montarPrompt(tema, item) {
  // Enquadramento muda por tema (cena, animal de corpo inteiro, flor…);
  // a regra de legibilidade em miniatura vale para todos
  const enquadramento =
    tema.composicao ?? 'one iconic, centered scene in the upper 80% of the card'

  return [
    `Watercolor illustration for a memory-game card, vertical 4:5 format (1024x1280).`,
    `Subject: ${item.referencia}. Show the elements that make it instantly recognizable and set it apart from any other ${tema.tipo}: ${item.elementos}.`,
    `Composition: ${enquadramento}, bold readable silhouette that still works as a small thumbnail (about 120 px wide), simple background, no clutter, generous margins.`,
    `Style: loose hand-painted watercolor on cold-press paper, soft wet-on-wet washes, visible paper grain, gentle pigment blooms and bleeding edges, delicate thin outlines (no hard black lines), harmonious palette of 3 to 5 main colors, warm soft daylight.`,
    `Background: plain, slightly yellowish warm cream paper (#F3EAD3); the painting fades softly into the paper near the edges. No frame, no border.`,
    `Text: at the bottom, centered, only the name "${item.nome}" hand-lettered in watercolor brush capital letters, same palette as the painting, spelled exactly like this (including accents), fully inside the card with margin. No other text, letters, numbers or signs anywhere in the image.`,
    `Keep the exact same paper color, brush technique, lettering style and lighting as the rest of the set.`,
    `Avoid: photorealism, 3D render, digital gradients, thick black outlines, logos, brand names, watermarks, signatures, borders, extra text, close-up portraits of people.`,
  ].join('\n')
}

function main() {
  const id = process.argv[2]

  if (!id) {
    console.error('Uso: node scripts/gerar-prompts.mjs <tema>   (ex.: cidades)')
    process.exit(1)
  }

  const pasta = join('temas', id)
  const tema = JSON.parse(readFileSync(join(pasta, 'tema.json'), 'utf8'))

  if (tema.itens.length !== CARTAS_POR_TEMA) {
    console.warn(
      `Atenção: ${tema.nome} tem ${tema.itens.length} cartas; o padrão é ${CARTAS_POR_TEMA}.`
    )
  }

  const blocos = tema.itens.map(
    (item, i) =>
      `### ${String(i + 1).padStart(3, '0')} — ${item.nome}  →  salvar como artes/${item.slug}.png\n\n${montarPrompt(tema, item)}`
  )

  writeFileSync(join(pasta, 'prompts.txt'), blocos.join('\n\n\n') + '\n')

  const csv = [
    'arquivo;prompt',
    ...tema.itens.map(
      (item) =>
        `${item.slug}.png;"${montarPrompt(tema, item).replace(/\n/g, ' ').replace(/"/g, '""')}"`
    ),
  ]
  writeFileSync(join(pasta, 'prompts.csv'), csv.join('\n') + '\n')

  console.log(`${tema.itens.length} prompts gerados em ${pasta}/prompts.txt e prompts.csv`)
}

// Só roda quando chamado direto (o subir-tema importa as constantes daqui)
if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
