import type { Card } from '@/lib/types'

/** O que aparece na frente da carta: a arte do tema ou o emoji. */
export function FaceCarta({
  card,
  pequena = false,
}: {
  card: Pick<Card, 'symbol' | 'label' | 'emoji' | 'image_url'>
  pequena?: boolean
}) {
  if (card.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arte vem do Storage, já no tamanho certo
      <img
        className={pequena ? 'face-arte face-arte-pequena' : 'face-arte'}
        src={card.image_url}
        alt=""
        draggable={false}
        decoding="async"
      />
    )
  }

  return (
    <span className={pequena ? 'face-emoji-pequeno' : 'carta-simbolo'}>
      {card.emoji ?? card.label ?? card.symbol}
    </span>
  )
}
