'use client'

import type { CSSProperties } from 'react'

import {
  classificacao,
  corDoJogador,
  formatarDuracao,
  ordenarJogadores,
  paresPorJogador,
  resumoPartida,
} from '@/lib/game'
import type { Card, Player, Room } from '@/lib/types'
import { Avatar } from '@/components/ui'
import { Mesa } from '@/components/Mesa'

type Props = {
  room: Room
  players: Player[]
  cards: Card[]
  cor: string
  meuPlayerId: string | null
  souHost: boolean
  ocupado: boolean
  onJogarNovamente: () => void
  onSair: () => void
}

/** Posições pseudoaleatórias, porém estáveis entre renderizações. */
function particulas(quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => ({
    left: (i * 37) % 100,
    delay: ((i * 53) % 40) / 10,
    duration: 3 + ((i * 29) % 30) / 10,
    rotate: (i * 71) % 360,
    cor: ['var(--blue)', 'var(--pink)', 'var(--yellow)', 'var(--green)'][i % 4],
  }))
}

export function TelaFinal({
  room,
  players,
  cards,
  cor,
  meuPlayerId,
  souHost,
  ocupado,
  onJogarNovamente,
  onSair,
}: Props) {
  const resumo = resumoPartida(room, cards)
  const completa = resumo.restantes === 0
  const nota = classificacao(resumo.encontrados, resumo.jogadas)
  const pares = paresPorJogador(cards)

  const duracao =
    room.started_at && room.finished_at
      ? formatarDuracao(Date.parse(room.finished_at) - Date.parse(room.started_at))
      : '—'

  // Quem jogou (ou ainda está na sala), do maior número de pares ao menor
  const placar = ordenarJogadores(players)
    .map((player) => ({ player, pares: pares.get(player.id) ?? 0 }))
    .filter((item) => item.pares > 0 || item.player.connected)
    .sort((a, b) => b.pares - a.pares)

  const maximo = placar[0]?.pares ?? 0
  const vencedores = placar.filter((item) => maximo > 0 && item.pares === maximo)
  const solo = placar.length <= 1
  const euVenci = vencedores.some((item) => item.player.id === meuPlayerId)

  let resultado: 'victory' | 'ended' = 'victory'
  let selo = 'Vitória!'
  let titulo = ''
  let subtitulo = ''

  if (!completa) {
    resultado = 'ended'
    selo = 'Fim de jogo'
    titulo = 'Partida encerrada'
    subtitulo = `O anfitrião encerrou com ${resumo.restantes} ${
      resumo.restantes === 1 ? 'par' : 'pares'
    } ainda na mesa.`
  } else if (solo) {
    selo = 'Mesa limpa!'
    titulo = 'Você achou todos os pares'
    subtitulo = `${resumo.total} pares em ${resumo.jogadas} jogadas.`
  } else if (vencedores.length > 1) {
    selo = 'Empate!'
    const nomes = vencedores.map((item) => item.player.name)
    titulo = `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`
    subtitulo = `Cada um com ${maximo} ${maximo === 1 ? 'par' : 'pares'}.`
  } else {
    titulo = euVenci ? 'Você venceu!' : `${vencedores[0]?.player.name} venceu!`
    subtitulo = `Com ${maximo} de ${resumo.total} pares.`
  }

  // Posição no pódio: empatados dividem a mesma posição
  const posicoes = placar.map(
    (item) => placar.findIndex((outro) => outro.pares === item.pares) + 1
  )

  return (
    <main className={`final final-${resultado}`}>
      {completa && (
        <div className="confete" aria-hidden="true">
          {particulas(46).map((p, i) => (
            <span
              key={i}
              style={
                {
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  background: p.cor,
                  '--giro': `${p.rotate}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <section className="final-conteudo">
        <div className="final-esq">
          <header className="final-topo">
            <span className="final-selo">{selo}</span>
            <h1 className="final-titulo">{titulo}</h1>
            <p className="final-subtitulo">{subtitulo}</p>
          </header>

          <div className="final-numeros">
            <div className="numero numero-destaque">
              <span className="numero-valor">
                {resumo.encontrados}
                <small>/{resumo.total}</small>
              </span>
              <span className="numero-rotulo">pares encontrados</span>
            </div>

            <div className="numero">
              <span className="numero-valor">{resumo.jogadas}</span>
              <span className="numero-rotulo">jogadas</span>
            </div>

            <div className="numero">
              <span className="numero-valor">{duracao}</span>
              <span className="numero-rotulo">tempo</span>
            </div>
          </div>

          <div className="final-nota">
            <span className="final-nota-rotulo">Memória do grupo</span>
            <strong>{nota.titulo}</strong>
            <span>{nota.texto}</span>
          </div>

          <div className="final-acoes">
            {souHost ? (
              <button
                className="btn btn-primario"
                onClick={onJogarNovamente}
                disabled={ocupado}
              >
                Jogar de novo
              </button>
            ) : (
              <div className="aguardando">
                Aguardando o anfitrião começar outra partida…
              </div>
            )}

            <button className="btn btn-claro" onClick={onSair}>
              Sair da sala
            </button>
          </div>
        </div>

        <div className="final-dir">
          <div className="final-bloco">
            <h2 className="bloco-titulo">Placar</h2>

            <ol className="podio">
              {placar.map(({ player, pares: dele }, i) => {
                const vencedor =
                  !solo && vencedores.some((item) => item.player.id === player.id)

                return (
                  <li key={player.id} className={vencedor ? 'vencedor' : ''}>
                    <span className="podio-posicao">
                      {vencedor ? '♛' : `${posicoes[i]}º`}
                    </span>
                    <Avatar
                      nome={player.name}
                      cor={corDoJogador(players, player.id)}
                      tamanho="sm"
                    />
                    <span className="final-jogador-nome">
                      {player.name}
                      {player.id === meuPlayerId && <em> (você)</em>}
                    </span>
                    <span className="final-jogador-placar">
                      {dele} {dele === 1 ? 'par' : 'pares'}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className="final-bloco final-bloco-mesa">
            <h2 className="bloco-titulo">Mesa revelada</h2>
            <Mesa
              compacta
              revelarTudo
              pares={room.pairs}
              cor={cor}
              cards={cards}
              players={players}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
