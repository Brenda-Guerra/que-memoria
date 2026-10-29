import type { Card } from '@/lib/types'
import { FaceCarta } from '@/components/FaceCarta'

/**
 * Carta recém-virada em tamanho grande, por cima da mesa, na tela de todos.
 * Não bloqueia cliques: quem está na vez pode seguir jogando por baixo.
 */
export function CartaZoom({
  cartas,
  resultado = null,
}: {
  cartas: Card[]
  resultado?: 'acertou' | 'errou' | null
}) {
  if (cartas.length === 0) return null

  return (
    <div
      className={`zoom-fundo ${cartas.length === 1 ? 'sozinha' : 'dupla'}`}
      aria-hidden="true"
    >
      <div className={`zoom-cartas ${resultado ?? ''}`}>
        {cartas.map((card) => (
          <div
            key={card.id}
            className={`zoom-carta ${card.image_url ? 'com-arte' : ''}`}
          >
            <FaceCarta card={card} />
          </div>
        ))}
      </div>
    </div>
  )
}
