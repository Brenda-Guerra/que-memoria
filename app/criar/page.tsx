'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { supabase } from '@/lib/supabase'
import { gerarCodigoSala, salvarJogador } from '@/lib/game'
import { Logo } from '@/components/ui'
import { BotaoSom } from '@/components/Som'
import { OpcoesPartida } from '@/components/OpcoesPartida'
import {
  PARES_PADRAO,
  TEMA_PADRAO,
  acharTema,
  temasComArte,
  useTemas,
} from '@/lib/temas'

export default function CriarSala() {
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [pares, setPares] = useState(PARES_PADRAO)
  const [tema, setTema] = useState(TEMA_PADRAO)
  const [tempo, setTempo] = useState('30')

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const temas = temasComArte(useTemas())
  // Se o tema padrão não existir no banco, fica o primeiro da lista
  const temaValido = acharTema(temas, tema) ?? temas?.[0] ?? null

  async function gerarCodigoUnico() {
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      const codigo = gerarCodigoSala()

      const { data, error } = await supabase
        .from('que_memoria_rooms')
        .select('id')
        .eq('code', codigo)
        .maybeSingle()

      if (error) throw error
      if (!data) return codigo
    }

    throw new Error('Não foi possível gerar um código de sala.')
  }

  async function criarSala(event: FormEvent) {
    event.preventDefault()

    if (!nome.trim()) {
      setErro('Digite seu nome.')
      return
    }

    if (!temaValido || temaValido.itens < pares) {
      setErro('Escolha um tema com cartas suficientes.')
      return
    }

    try {
      setLoading(true)
      setErro('')

      const codigo = await gerarCodigoUnico()

      const { data: sala, error: roomError } = await supabase
        .from('que_memoria_rooms')
        .insert({
          code: codigo,
          pairs: pares,
          theme: temaValido.id,
          turn_time: tempo === 'unlimited' ? null : Number(tempo),
          status: 'waiting',
        })
        .select()
        .single()

      if (roomError) throw roomError

      const { data: jogador, error: playerError } = await supabase
        .from('que_memoria_players')
        .insert({
          room_id: sala.id,
          name: nome.trim(),
          is_host: true,
          connected: true,
          player_order: 1,
        })
        .select()
        .single()

      if (playerError) throw playerError

      const { error: updateError } = await supabase
        .from('que_memoria_rooms')
        .update({ host_id: jogador.id })
        .eq('id', sala.id)

      if (updateError) throw updateError

      salvarJogador(codigo, jogador.id)

      router.push(`/sala/${codigo}`)
    } catch (error) {
      console.error(error)
      setErro('Não foi possível criar a sala. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="pagina">
      <header className="topo">
        <Link href="/" aria-label="Início">
          <Logo />
        </Link>
        <BotaoSom />
      </header>

      <section className="conteudo">
        <Link href="/" className="voltar">
          ← Voltar
        </Link>

        <div className="cartao cartao-form">
          <h1 className="titulo-pagina">Criar sala</h1>
          <p className="descricao-pagina">
            Escolha quantas peças vão para a mesa, o tema das cartas e o
            tempo de cada vez.
          </p>

          <form onSubmit={criarSala}>
            <div className="campo">
              <label className="rotulo" htmlFor="nome">
                Seu nome
              </label>
              <input
                id="nome"
                className="input"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                maxLength={40}
                placeholder="Como te chamam?"
                autoComplete="nickname"
              />
            </div>

            <OpcoesPartida
              temas={temas}
              pares={pares}
              tema={temaValido?.id ?? tema}
              tempo={tempo}
              onPares={setPares}
              onTema={setTema}
              onTempo={setTempo}
            />

            {erro && <div className="erro">{erro}</div>}

            <button
              className="btn btn-primario btn-grande"
              disabled={loading || !temaValido}
              type="submit"
            >
              {loading ? 'Criando…' : 'Criar sala'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
