'use client'

import type { CSSProperties } from 'react'

import { corDoJogador, ordenarCartas } from '@/lib/game'
import { formatoMesa } from '@/lib/temas'
import type { Card, Player } from '@/lib/types'
import { FaceCarta } from '@/components/FaceCarta'

type Props = {
  pares: number
  /** cor de fundo das cartas já encontradas (vem do tema) */
  cor?: string
  cards: Card[]
  players: Player[]
  /** posições viradas na jogada atual */
  primeira?: number | null
  segunda?: number | null
  podeVirar?: boolean
  onVirar?: (posicao: number) => void
  /** tela final: mostra todas as cartas */
  revelarTudo?: boolean
  compacta?: boolean
}

export function Mesa({
  pares,
  cor,
  cards,
  players,
  primeira = null,
  segunda = null,
  podeVirar = false,
  onVirar,
  revelarTudo = false,
  compacta = false,
}: Props) {
  const formato = formatoMesa(pares)
  const ordenadas = ordenarCartas(cards)

  const cartaA = ordenadas.find((card) => card.position === primeira)
  const cartaB = ordenadas.find((card) => card.position === segunda)
  const jogadaCompleta = !!cartaA && !!cartaB
  const acertou = jogadaCompleta && cartaA.symbol === cartaB.symbol
  const temArte = ordenadas.some((card) => card.image_url)

  return (
    <div className="mesa-caixa">
      <div
        className={`mesa ${compacta ? 'compacta' : ''} ${temArte ? 'com-arte' : ''}`}
        style={
          {
            '--colunas': formato.colunas,
            '--linhas': formato.linhas,
            '--tema': cor,
          } as CSSProperties
        }
      >
        {ordenadas.map((card) => {
          const escolhida =
            card.position === primeira || card.position === segunda
          const encontrada = !!card.matched_by
          const virada = encontrada || escolhida || revelarTudo
          const clicavel = podeVirar && !virada

          let classe = 'carta'
          if (virada) classe += ' virada'
          if (encontrada) classe += ' par'
          else if (escolhida) {
            classe += ' escolhida'
            if (jogadaCompleta) classe += acertou ? ' acertou' : ' errou'
          }
          if (clicavel) classe += ' clicavel'

          const dono = encontrada
            ? players.find((player) => player.id === card.matched_by)
            : undefined

          return (
            <button
              key={card.id}
              type="button"
              className={classe}
              disabled={!clicavel}
              onClick={() => clicavel && onVirar?.(card.position)}
              aria-label={
                virada
                  ? `Carta ${card.position + 1}: ${card.label ?? card.emoji ?? ''}`
                  : `Carta ${card.position + 1}, virada para baixo`
              }
            >
              <span className="carta-miolo">
                <span className="carta-face carta-verso" aria-hidden="true">
                  <span className="carta-interrogacao">?</span>
                </span>

                <span className="carta-face carta-frente" aria-hidden="true">
                  <FaceCarta card={card} />

                  {dono && (
                    <span
                      className="carta-dono"
                      style={{ background: corDoJogador(players, dono.id) }}
                      title={`Par de ${dono.name}`}
                    >
                      {dono.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
