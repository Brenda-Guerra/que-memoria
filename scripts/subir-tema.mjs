// Sobe as artes de um tema para o Storage e cadastra o tema no banco.
//
//   node --env-file=.env.local scripts/subir-tema.mjs cidades
//   node --env-file=.env.local scripts/subir-tema.mjs cidades --simular
//
// Lê temas/<tema>/tema.json e as imagens em temas/<tema>/artes/<slug>.(webp|png|jpg|jpeg|avif).
// Precisa da chave SECRETA no .env.local (nunca com NEXT_PUBLIC_):
//   SUPABASE_SECRET_KEY=sb_secret_...
// (Supabase → Project Settings → API Keys → Secret keys)
//
// Pode rodar de novo quando adicionar ou refizer artes: substitui o que mudou.
// Item sem arte na pasta fica de fora (e é listado no fim).

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { createClient } from '@supabase/supabase-js'

import { CARTAS_POR_TEMA } from './gerar-prompts.mjs'

const BUCKET = 'que-memoria'

const TIPOS = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
}

function acharArte(pasta, slug) {
  for (const extensao of Object.keys(TIPOS)) {
    const arquivo = join(pasta, 'artes', `${slug}.${extensao}`)
    if (existsSync(arquivo)) return { arquivo, extensao }
  }

  return null
}

async function main() {
  const id = process.argv[2]
  const simular = process.argv.includes('--simular')

  if (!id) {
    console.error('Uso: node --env-file=.env.local scripts/subir-tema.mjs <tema> [--simular]')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  const pasta = join('temas', id)
  const tema = JSON.parse(readFileSync(join(pasta, 'tema.json'), 'utf8'))

  const comArte = []
  const semArte = []

  for (const [ordem, item] of tema.itens.entries()) {
    const arte = acharArte(pasta, item.slug)

    if (arte) comArte.push({ ...item, ...arte, ordem })
    else semArte.push(item)
  }

  console.log(
    `${tema.nome}: ${comArte.length} de ${CARTAS_POR_TEMA} artes prontas, ${semArte.length} faltando`
  )

  if (simular) {
    semArte.forEach((item) => console.log(`  falta: artes/${item.slug}.png (${item.nome})`))
    return
  }

  if (comArte.length < 2) {
    console.error('Precisa de pelo menos 2 artes para o tema aparecer no jogo.')
    process.exit(1)
  }

  if (!url || !chave) {
    console.error('Faltou NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY no .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, chave, { auth: { persistSession: false } })

  // 1. Arquivos no Storage (blobs)
  for (const [i, item] of comArte.entries()) {
    item.caminho = `${tema.id}/${item.slug}.${item.extensao}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(item.caminho, readFileSync(item.arquivo), {
        contentType: TIPOS[item.extensao],
        cacheControl: '31536000',
        upsert: true,
      })

    if (error) throw new Error(`${item.slug}: ${error.message}`)

    process.stdout.write(`\r  enviando artes… ${i + 1}/${comArte.length}`)
  }
  console.log()

  // 2. Tema
  const capa = comArte.find((item) => item.slug === tema.capa) ?? comArte[0]

  const { error: temaError } = await supabase.from('que_memoria_themes').upsert({
    id: tema.id,
    name: tema.nome,
    kind: 'image',
    cover_emoji: null,
    cover_path: capa.caminho,
    color: tema.cor ?? '#f3ead3',
    sort_order: tema.ordem ?? 100,
    active: true,
  })

  if (temaError) throw temaError

  // 3. Itens (os que não têm arte ficam inativos, se já existiam)
  const { error: itensError } = await supabase
    .from('que_memoria_theme_items')
    .upsert(
      comArte.map((item) => ({
        theme_id: tema.id,
        slug: item.slug,
        name: item.nome,
        emoji: null,
        image_path: item.caminho,
        sort_order: item.ordem,
        active: true,
      })),
      { onConflict: 'theme_id,slug' }
    )

  if (itensError) throw itensError

  if (semArte.length > 0) {
    await supabase
      .from('que_memoria_theme_items')
      .update({ active: false })
      .eq('theme_id', tema.id)
      .in('slug', semArte.map((item) => item.slug))
  }

  console.log(`Pronto! Tema "${tema.nome}" com ${comArte.length} cartas no jogo.`)
  semArte.forEach((item) => console.log(`  ainda sem arte: ${item.slug} (${item.nome})`))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
