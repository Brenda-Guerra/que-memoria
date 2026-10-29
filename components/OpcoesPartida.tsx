'use client'

import type { CSSProperties } from 'react'

import { QUANTIDADES, TEMPOS, acharTema, type Tema } from '@/lib/temas'

type Props = {
  /** temas do banco; null enquanto carregam */
  temas: Tema[] | null
  pares: number
  tema: string
  tempo: string
  onPares: (pares: number) => void
  onTema: (tema: string) => void
  onTempo: (tempo: string) => void
}

/** Maior mesa que cabe no tema (cada item vira um par). */
export function maiorMesa(tema: Tema | null) {
  const cabem = QUANTIDADES.filter((item) => item.pecas / 2 <= (tema?.itens ?? 0))
  return cabem.at(-1)?.pecas ?? 0
}

/** Escolha de peças, tema e tempo — usada ao criar a sala e na sala de espera. */
export function OpcoesPartida({
  temas,
  pares,
  tema,
  tempo,
  onPares,
  onTema,
  onTempo,
}: Props) {
  const temaAtual = acharTema(temas, tema)
  const limite = temaAtual ? temaAtual.itens : Infinity

  function escolherTema(novo: Tema) {
    onTema(novo.id)

    // Tema menor que a mesa escolhida: reduz para a maior que cabe
    if (novo.itens < pares) {
      const maior = maiorMesa(novo)
      if (maior > 0) onPares(maior / 2)
    }
  }

  return (
    <>
      <div className="campo">
        <span className="rotulo">Tema</span>

        {temas === null ? (
          <div className="opcoes opcoes-temas" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="opcao opcao-tema opcao-carregando" />
            ))}
          </div>
        ) : temas.length === 0 ? (
          <p className="erro">
            Nenhum tema com arte cadastrado. Veja temas/LEIA-ME.md.
          </p>
        ) : (
          <div className="opcoes opcoes-temas" role="radiogroup">
            {temas.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={tema === item.id}
                className={`opcao opcao-tema ${tema === item.id ? 'ativa' : ''}`}
                onClick={() => escolherTema(item)}
                disabled={item.itens < 2}
                title={`${item.itens} cartas`}
              >
                <span
                  className="opcao-tema-capa"
                  style={{ '--tema': item.color } as CSSProperties}
                  aria-hidden="true"
                >
                  {item.capaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- capa vem do Storage
                    <img src={item.capaUrl} alt="" />
                  ) : (
                    item.cover_emoji
                  )}
                </span>
                <span className="opcao-tema-nome">{item.name}</span>
              </button>
            ))}
          </div>
        )}

        {temaAtual && (
          <p className="dica">
            {temaAtual.itens} cartas diferentes
            {temaAtual.kind === 'image' ? ' com arte' : ''} — a cada partida
            sai uma seleção nova.
          </p>
        )}
      </div>

      <div className="campo">
        <span className="rotulo">Peças</span>
        <div className="opcoes opcoes-pecas" role="radiogroup">
          {QUANTIDADES.map((item) => {
            const ativa = pares * 2 === item.pecas
            const cabe = item.pecas / 2 <= limite

            return (
              <button
                key={item.pecas}
                type="button"
                role="radio"
                aria-checked={ativa}
                className={`opcao ${ativa ? 'ativa' : ''}`}
                onClick={() => onPares(item.pecas / 2)}
                disabled={!cabe}
                title={cabe ? undefined : 'O tema não tem cartas suficientes'}
              >
                <span
                  className="mini-grade"
                  style={{
                    gridTemplateColumns: `repeat(${item.colunas}, 1fr)`,
                    gap: item.colunas > 6 ? 1 : undefined,
                  }}
                  aria-hidden="true"
                >
                  {Array.from({ length: item.pecas }).map((_, i) => (
                    <i key={i} />
                  ))}
                </span>
                {item.pecas}
              </button>
            )
          })}
        </div>
        <p className="dica">{pares} pares para encontrar</p>
      </div>

      <div className="campo">
        <span className="rotulo">Tempo por vez</span>
        <div className="opcoes opcoes-tempo" role="radiogroup">
          {TEMPOS.map((item) => (
            <button
              key={item.valor}
              type="button"
              role="radio"
              aria-checked={tempo === item.valor}
              className={`opcao ${tempo === item.valor ? 'ativa' : ''}`}
              onClick={() => onTempo(item.valor)}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
        <p className="dica">
          Acabou o tempo antes de virar as duas cartas? Passa a vez.
        </p>
      </div>
    </>
  )
}
