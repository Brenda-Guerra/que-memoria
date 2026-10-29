'use client'

import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import type { Theme } from '@/lib/types'

/** Bucket do Storage onde ficam as artes das cartas. */
export const BUCKET_ARTES = 'que-memoria'

export type Tema = Theme & {
  /** quantos itens ativos o tema tem (limita o número de peças) */
  itens: number
  /** URL pública da capa, para temas de arte */
  capaUrl: string | null
}

export function urlArte(caminho: string | null | undefined) {
  if (!caminho) return null

  return supabase.storage.from(BUCKET_ARTES).getPublicUrl(caminho).data
    .publicUrl
}

export async function buscarTemas(): Promise<Tema[]> {
  const { data, error } = await supabase
    .from('que_memoria_themes_resumo')
    .select('*')
    .order('sort_order')
    .order('name')

  if (error) throw error

  return (data ?? []).map(({ item_count, ...tema }) => ({
    ...(tema as Theme),
    itens: item_count ?? 0,
    capaUrl: urlArte(tema.cover_path),
  }))
}

/** Temas do banco, carregados uma vez por página. null enquanto carrega. */
export function useTemas() {
  const [temas, setTemas] = useState<Tema[] | null>(null)

  useEffect(() => {
    let cancelado = false

    buscarTemas()
      .then((lista) => {
        if (!cancelado) setTemas(lista)
      })
      .catch((error) => {
        console.error(error)
        if (!cancelado) setTemas([])
      })

    return () => {
      cancelado = true
    }
  }, [])

  return temas
}

/** Só os temas com arte própria aparecem na escolha (os de emoji ficam de fora). */
export function temasComArte(temas: Tema[] | null) {
  return temas?.filter((tema) => tema.kind === 'image') ?? null
}

export function acharTema(temas: Tema[] | null, id: string | null | undefined) {
  return temas?.find((tema) => tema.id === id) ?? null
}

/** Quantidades de peças e o formato da mesa (deitada) para cada uma. */
export const QUANTIDADES = [
  { pecas: 40, colunas: 8, linhas: 5 },
  { pecas: 60, colunas: 10, linhas: 6 },
  { pecas: 80, colunas: 10, linhas: 8 },
  { pecas: 100, colunas: 10, linhas: 10 },
]

/** Mesa padrão ao criar a sala (em pares). */
export const PARES_PADRAO = 20

/** Tema padrão ao criar a sala; se não existir, fica o primeiro da lista. */
export const TEMA_PADRAO = 'cidades'

export function formatoMesa(pares: number) {
  return (
    QUANTIDADES.find((item) => item.pecas === pares * 2) ?? {
      pecas: pares * 2,
      colunas: 6,
      linhas: Math.ceil((pares * 2) / 6),
    }
  )
}

export const TEMPOS = [
  { valor: '15', rotulo: '15 s' },
  { valor: '30', rotulo: '30 s' },
  { valor: '60', rotulo: '1 min' },
  { valor: 'unlimited', rotulo: '∞' },
]
