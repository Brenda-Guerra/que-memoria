import type { Card } from '@/lib/types'
import { FaceCarta } from '@/components/FaceCarta'

/**
 * Carta recém-virada em tamanho grande, por cima da mesa, na tela de todos.
 * Um toque em qualquer lugar fecha o zoom — sem virar, sem querer, a carta de baixo.
 */
export function CartaZoom({
  cartas,
  resultado = null,
  onFechar,
}: {
  cartas: Card[]
  resultado?: 'acertou' | 'errou' | null
  onFechar: () => void
}) {
  if (cartas.length === 0) return null

  return (
    <div
      className={`zoom-fundo ${cartas.length === 1 ? 'sozinha' : 'dupla'}`}
      aria-hidden="true"
      onClick={onFechar}
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
