import Link from 'next/link'
import type { CSSProperties } from 'react'

import { Logo } from '@/components/ui'
import { BotaoSom } from '@/components/Som'

// Mesa de exemplo: um par já achado e cartas que viram sozinhas
const DEMO = [
  { simbolo: '🐶', estado: 'fechada' },
  { simbolo: '🦊', estado: 'espia', atraso: 0 },
  { simbolo: '🐼', estado: 'par' },
  { simbolo: '🐸', estado: 'fechada' },
  { simbolo: '🐼', estado: 'par' },
  { simbolo: '🐯', estado: 'fechada' },
  { simbolo: '🐵', estado: 'espia', atraso: 2.4 },
  { simbolo: '🦊', estado: 'espia', atraso: 0.25 },
  { simbolo: '🐸', estado: 'fechada' },
  { simbolo: '🐵', estado: 'espia', atraso: 2.65 },
  { simbolo: '🐶', estado: 'fechada' },
  { simbolo: '🐯', estado: 'fechada' },
]

export default function Home() {
  return (
    <main className="pagina">
      <header className="topo">
        <Logo />
        <BotaoSom />
      </header>

      <section className="conteudo conteudo-largo inicio">
        <div className="inicio-texto">
          <span className="sobretitulo">Jogo da memória multiplayer</span>

          <h1 className="inicio-titulo">
            Cadê o
            <br />
            <span>par?</span>
          </h1>

          <p className="inicio-sub">
            Vire duas cartas por vez e encontre os pares. Acertou? Joga de
            novo. Quem juntar mais pares no fim vence a partida!
          </p>

          <div className="botoes botoes-inicio">
            <Link href="/criar" className="btn btn-primario btn-grande">
              Criar uma sala
            </Link>
            <Link href="/entrar" className="btn btn-rosa btn-grande">
              Entrar com código
            </Link>
          </div>

          <ul className="inicio-fatos">
            <li>
              <strong>1+</strong> jogadores
            </li>
            <li>
              <strong>40</strong> a <strong>100</strong> peças
            </li>
            <li>
              <strong>100</strong> cartas por tema
            </li>
          </ul>
        </div>

        <div className="inicio-demo" aria-hidden="true">
          <div
            className="demo-mesa"
            style={{ '--tema': 'var(--yellow-light)' } as CSSProperties}
          >
            {DEMO.map((carta, i) => (
              <span
                key={i}
                className={`carta ${carta.estado !== 'fechada' ? 'virada' : ''} ${
                  carta.estado === 'par' ? 'par' : ''
                }`}
                style={{ animationDelay: `${carta.atraso ?? 0}s` }}
              >
                <span className="carta-miolo">
                  <span className="carta-face carta-verso">
                    <span className="carta-interrogacao">?</span>
                  </span>
                  <span className="carta-face carta-frente">
                    <span className="carta-simbolo">{carta.simbolo}</span>
                  </span>
                </span>
              </span>
            ))}
          </div>

          <div className="demo-bolha">
            <small>achou um par</small>
            🐼 + 🐼
          </div>
        </div>
      </section>
    </main>
  )
}
