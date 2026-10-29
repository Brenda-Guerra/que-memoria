'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useParams, useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabase'
import {
  FOLGA_RESERVA_MS,
  TEMPO_REVELACAO_MS,
  corDoJogador,
  esquecerJogador,
  finalizarPartida,
  obterJogador,
  ordenarJogadores,
  paresPorJogador,
  passarVez,
  resolverJogada,
  resumoPartida,
  sairDaSala,
  virarCarta,
} from '@/lib/game'
import { useAgora, useAviso, usePresenca } from '@/lib/hooks'
import { acharTema, useTemas } from '@/lib/temas'
import type { Card, Player, Room } from '@/lib/types'
import { Mesa } from '@/components/Mesa'
import { FaceCarta } from '@/components/FaceCarta'
import { CartaZoom } from '@/components/CartaZoom'
import { TelaFinal } from '@/components/TelaFinal'
import { BotaoSom } from '@/components/Som'
import { tocarEfeito } from '@/lib/som'
import {
  Avatar,
  Aviso,
  Carregando,
  Logo,
  Modal,
} from '@/components/ui'

/** A última jogada fica na tela um pouco antes do resultado final. */
const TEMPO_ULTIMO_PAR_MS = 1800

/** A primeira carta virada fica ampliada por este tempo na tela de todos. */
const TEMPO_ZOOM_MS = 1300

/** Quem está na vez e sumiu (fechou a aba) perde a vez depois disso. */
const TEMPO_AUSENTE_MS = 8000

function cartasViradas(room: Room) {
  return (room.first_pick === null ? 0 : 1) + (room.second_pick === null ? 0 : 1)
}

/**
 * Enquanto um clique meu ainda não foi confirmado, uma resposta do banco
 * pode chegar com menos cartas viradas — mantenho as minhas na tela.
 */
function mesclarSala(atual: Room | null, nova: Room, pendentes: number) {
  if (
    pendentes > 0 &&
    atual &&
    atual.turn_number === nova.turn_number &&
    cartasViradas(atual) > cartasViradas(nova)
  ) {
    return {
      ...nova,
      first_pick: atual.first_pick,
      second_pick: atual.second_pick,
      picked_at: atual.picked_at,
    }
  }

  return nova
}

export default function Jogo() {
  const params = useParams()
  const router = useRouter()

  const codigo = String(params.codigo).toUpperCase()

  const [meuPlayerId, setMeuPlayerId] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [cards, setCards] = useState<Card[]>([])

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const [ocupado, setOcupado] = useState(false)
  const [modal, setModal] = useState<'sair' | 'encerrar' | 'menu' | null>(
    null
  )

  const { aviso, avisar } = useAviso()
  const agora = useAgora(250)
  const online = usePresenca(room?.id, meuPlayerId)
  const processando = useRef(new Set<string>())
  // Cliques em sequência são enviados em fila, na ordem em que aconteceram
  const filaViradas = useRef<Promise<unknown>>(Promise.resolve())
  const viradasPendentes = useRef(0)

  const roomId = room?.id

  /* ---------------------------------------------------------------- */
  /* Busca de dados                                                   */
  /* ---------------------------------------------------------------- */

  const buscarJogadores = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('que_memoria_players')
      .select('*')
      .eq('room_id', id)

    if (data) setPlayers(data)
  }, [])

  /**
   * Sala e cartas juntas: o par é marcado nas cartas antes de a sala
   * limpar a jogada, então buscar os dois evita a carta "piscar".
   */
  const buscarMesa = useCallback(async (id: string) => {
    const [{ data: sala }, { data: cartas }] = await Promise.all([
      supabase.from('que_memoria_rooms').select('*').eq('id', id).maybeSingle(),
      supabase.from('que_memoria_cards').select('*').eq('room_id', id),
    ])

    if (sala) {
      setRoom((atual) => mesclarSala(atual, sala, viradasPendentes.current))
    }
    if (cartas) setCards(cartas)
  }, [])

  // Carga inicial
  useEffect(() => {
    let cancelado = false

    async function carregar() {
      const playerId = obterJogador(codigo)

      if (!playerId) {
        router.replace(`/entrar?codigo=${codigo}`)
        return
      }

      const { data: sala, error } = await supabase
        .from('que_memoria_rooms')
        .select('*')
        .eq('code', codigo)
        .maybeSingle()

      if (cancelado) return

      if (error || !sala) {
        setErro(error ? 'Erro ao carregar a partida.' : 'Sala não encontrada.')
        setLoading(false)
        return
      }

      if (sala.status === 'waiting') {
        router.replace(`/sala/${codigo}`)
        return
      }

      const { data: eu } = await supabase
        .from('que_memoria_players')
        .select('*')
        .eq('id', playerId)
        .eq('room_id', sala.id)
        .maybeSingle()

      if (!eu) {
        esquecerJogador(codigo)
        router.replace(`/entrar?codigo=${codigo}`)
        return
      }

      if (!eu.connected) {
        await supabase
          .from('que_memoria_players')
          .update({ connected: true })
          .eq('id', playerId)
      }

      await Promise.all([buscarJogadores(sala.id), buscarMesa(sala.id)])

      if (cancelado) return

      setMeuPlayerId(playerId)
      setLoading(false)
    }

    carregar()

    return () => {
      cancelado = true
    }
  }, [codigo, router, buscarJogadores, buscarMesa])

  // Tempo real
  useEffect(() => {
    if (!roomId) return

    const filtro = `room_id=eq.${roomId}`

    const channel = supabase
      .channel(`memoria-jogo-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'que_memoria_rooms',
          filter: `id=eq.${roomId}`,
        },
        () => buscarMesa(roomId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'que_memoria_players', filter: filtro },
        () => buscarJogadores(roomId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'que_memoria_cards', filter: filtro },
        () => buscarMesa(roomId)
      )
      .subscribe((status) => {
        // Recarrega tudo ao (re)conectar, para não perder nada
        if (status === 'SUBSCRIBED') {
          buscarMesa(roomId)
          buscarJogadores(roomId)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, buscarMesa, buscarJogadores])

  // Anfitrião reiniciou → todos voltam para a sala de espera
  useEffect(() => {
    if (room?.status === 'waiting') {
      router.replace(`/sala/${codigo}`)
    }
  }, [room?.status, codigo, router])

  /* ---------------------------------------------------------------- */
  /* Estado derivado                                                  */
  /* ---------------------------------------------------------------- */

  const emJogo = room?.status === 'playing'
  const ordenados = useMemo(() => ordenarJogadores(players), [players])
  const conectados = ordenados.filter((player) => player.connected)

  const jogadorDaVez = emJogo
    ? players.find((player) => player.id === room.current_player_id) ?? null
    : null

  const souDaVez = emJogo && room.current_player_id === meuPlayerId
  const souHost = !!room && room.host_id === meuPlayerId

  const pares = useMemo(() => paresPorJogador(cards), [cards])
  const resumo = resumoPartida(
    { pairs: room?.pairs ?? 0, moves: room?.moves ?? 0 },
    cards
  )
  const temas = useTemas()
  const tema = acharTema(temas, room?.theme)
  const corTema = tema?.color ?? 'var(--yellow-light)'

  const cartaA = cards.find((card) => card.position === room?.first_pick)
  const cartaB = cards.find((card) => card.position === room?.second_pick)
  const jogadaCompleta = emJogo && !!cartaA && !!cartaB
  const acertou = jogadaCompleta && cartaA.symbol === cartaB.symbol

  // Zoom: a primeira carta aparece sozinha por um instante; com a segunda,
  // as duas ficam ampliadas até a jogada ser resolvida
  const [zoomEncerrado, setZoomEncerrado] = useState<string | null>(null)
  const chavePrimeira =
    emJogo && room.first_pick !== null && room.second_pick === null
      ? `${room.turn_number}:${room.first_pick}`
      : null

  useEffect(() => {
    if (!chavePrimeira) return

    const id = setTimeout(() => setZoomEncerrado(chavePrimeira), TEMPO_ZOOM_MS)

    return () => clearTimeout(id)
  }, [chavePrimeira])

  const cartasZoom = jogadaCompleta
    ? [cartaA, cartaB]
    : cartaA && chavePrimeira && zoomEncerrado !== chavePrimeira
      ? [cartaA]
      : []

  // Durante a revelação o relógio para
  const inicioVez = room?.turn_started_at ? Date.parse(room.turn_started_at) : 0
  const relogioAgora = room?.picked_at ? Date.parse(room.picked_at) : agora

  const restante =
    room?.turn_time && emJogo
      ? Math.max(
          0,
          Math.min(
            room.turn_time,
            Math.ceil((inicioVez + room.turn_time * 1000 - relogioAgora) / 1000)
          )
        )
      : null

  // O último par fica na mesa por um instante antes do resultado
  const mostrandoUltimoPar =
    room?.status === 'finished' &&
    !!room.finished_at &&
    resumo.restantes === 0 &&
    agora < Date.parse(room.finished_at) + TEMPO_ULTIMO_PAR_MS

  const vezAusente =
    emJogo &&
    room.second_pick === null &&
    !!room.current_player_id &&
    (jogadorDaVez?.connected === false ||
      (!!online && !online.has(room.current_player_id)))

  const paresAchados = useMemo(() => {
    const vistos = new Set<string>()

    return [...cards]
      .filter((card) => card.matched_by)
      .sort((a, b) => (a.matched_at ?? '').localeCompare(b.matched_at ?? ''))
      .filter((card) => {
        if (vistos.has(card.symbol)) return false
        vistos.add(card.symbol)
        return true
      })
  }, [cards])

  /* ---------------------------------------------------------------- */
  /* Sons                                                             */
  /* ---------------------------------------------------------------- */

  const ultimoSom = useRef({
    virada: '',
    resultado: '',
    vez: '',
    tique: '',
    fim: '',
  })

  // Carta virando
  useEffect(() => {
    if (!room || room.status !== 'playing') return

    const chave = `${room.turn_number}:${room.first_pick}:${room.second_pick}`
    const anterior = ultimoSom.current.virada
    if (anterior === chave) return
    ultimoSom.current.virada = chave

    if (anterior && room.first_pick !== null) tocarEfeito('virar')
  }, [room])

  // Par ou erro, logo depois da segunda carta
  useEffect(() => {
    if (!jogadaCompleta || !room) return

    const chave = String(room.turn_number)
    if (ultimoSom.current.resultado === chave) return
    ultimoSom.current.resultado = chave

    setTimeout(() => tocarEfeito(acertou ? 'par' : 'erro'), 450)
  }, [jogadaCompleta, acertou, room])

  // Chegou a minha vez
  useEffect(() => {
    if (!room || room.status !== 'playing') return

    const anterior = ultimoSom.current.vez
    ultimoSom.current.vez = room.current_player_id ?? ''

    if (souDaVez && anterior !== meuPlayerId && conectados.length > 1) {
      tocarEfeito('suaVez')
    }
  }, [room, souDaVez, meuPlayerId, conectados.length])

  // Tique nos últimos 5 segundos (mais agudo nos 2 finais)
  useEffect(() => {
    if (!room || !emJogo || restante === null || room.second_pick !== null) {
      return
    }
    if (restante > 5 || restante <= 0) return

    const chave = `${room.turn_number}:${restante}`
    if (ultimoSom.current.tique === chave) return
    ultimoSom.current.tique = chave

    tocarEfeito(restante <= 2 ? 'tiqueUrgente' : 'tique')
  }, [room, emJogo, restante])

  // Mesa completa
  useEffect(() => {
    if (room?.status !== 'finished' || resumo.restantes !== 0) return
    if (ultimoSom.current.fim === room.id) return
    ultimoSom.current.fim = room.id

    setTimeout(() => tocarEfeito('fim'), 600)
  }, [room?.status, room?.id, resumo.restantes])

  /* ---------------------------------------------------------------- */
  /* Andamento automático                                             */
  /* ---------------------------------------------------------------- */

  /**
   * Roda uma ação uma única vez por chave neste aparelho. Se ela falhar
   * (ou retornar false), a chave é liberada para tentar de novo.
   */
  const umaVez = useCallback(
    (chave: string, acao: () => Promise<unknown>) => {
      if (processando.current.has(chave)) return
      processando.current.add(chave)

      acao()
        .then((resultado) => {
          if (resultado === false) processando.current.delete(chave)
        })
        .catch((error) => {
          console.error(error)
          processando.current.delete(chave)
        })
    },
    []
  )

  // Duas cartas viradas → depois da revelação, marca o par ou passa a vez.
  // Quem jogou resolve; os outros só entram se ele sumir.
  useEffect(() => {
    if (!room || room.status !== 'playing') return
    if (room.second_pick === null || !room.picked_at) return

    const espera =
      Date.parse(room.picked_at) +
      TEMPO_REVELACAO_MS +
      (souDaVez ? 0 : FOLGA_RESERVA_MS) -
      Date.now()

    const id = setTimeout(
      () =>
        umaVez(`resolver:${room.turn_number}`, () =>
          resolverJogada({ room, cards, players, onlineIds: online })
        ),
      Math.max(0, espera)
    )

    return () => clearTimeout(id)
  }, [room, cards, players, online, souDaVez, umaVez])

  // Tempo esgotado → passa a vez
  useEffect(() => {
    if (!room || room.status !== 'playing' || !room.turn_time) return
    if (room.second_pick !== null || !room.turn_started_at) return

    const prazo =
      Date.parse(room.turn_started_at) +
      room.turn_time * 1000 +
      (souDaVez ? 0 : FOLGA_RESERVA_MS)

    if (agora < prazo) return

    umaVez(`tempo:${room.turn_number}`, async () => {
      await passarVez({ room, players, onlineIds: online })
      if (souDaVez) avisar('Acabou o seu tempo! A vez passou.')
    })
  }, [room, agora, souDaVez, players, online, umaVez, avisar])

  // Quem está na vez saiu ou fechou a aba → passa a vez
  useEffect(() => {
    if (!vezAusente || !room) return

    const id = setTimeout(
      () =>
        umaVez(`ausente:${room.turn_number}`, () =>
          passarVez({ room, players, onlineIds: online })
        ),
      TEMPO_AUSENTE_MS
    )

    return () => clearTimeout(id)
  }, [vezAusente, room, players, online, umaVez])

  /* ---------------------------------------------------------------- */
  /* Ações                                                            */
  /* ---------------------------------------------------------------- */

  function virar(posicao: number) {
    if (!room || !meuPlayerId || !souDaVez || room.second_pick !== null) return

    const antes = room

    // Vira na hora na minha tela; o banco confirma em seguida
    setRoom(
      antes.first_pick === null
        ? { ...antes, first_pick: posicao }
        : {
            ...antes,
            second_pick: posicao,
            picked_at: new Date().toISOString(),
          }
    )

    viradasPendentes.current++

    filaViradas.current = filaViradas.current.then(async () => {
      try {
        const atualizada = await virarCarta(antes, meuPlayerId, posicao)
        viradasPendentes.current--

        if (atualizada) {
          setRoom((atual) =>
            mesclarSala(atual, atualizada, viradasPendentes.current)
          )
        } else {
          await buscarMesa(antes.id)
        }
      } catch (error) {
        viradasPendentes.current--
        console.error(error)
        avisar('Não foi possível virar a carta.')
        await buscarMesa(antes.id)
      }
    })
  }

  async function pularVez() {
    if (!room || !emJogo) return

    setOcupado(true)

    try {
      await passarVez({ room, players, onlineIds: online })
      avisar(`Vez de ${jogadorDaVez?.name ?? 'alguém'} pulada.`)
    } catch (error) {
      console.error(error)
      avisar('Não foi possível pular a vez.')
    } finally {
      setOcupado(false)
    }
  }

  async function encerrar() {
    if (!room) return

    setModal(null)
    setOcupado(true)

    try {
      await finalizarPartida(room.id)
    } catch (error) {
      console.error(error)
      avisar('Não foi possível encerrar a partida.')
    } finally {
      setOcupado(false)
    }
  }

  async function jogarNovamente() {
    if (!room) return

    setOcupado(true)

    const { error } = await supabase
      .from('que_memoria_rooms')
      .update({
        status: 'waiting',
        current_player_id: null,
        first_pick: null,
        second_pick: null,
        picked_at: null,
        started_at: null,
        finished_at: null,
      })
      .eq('id', room.id)

    if (error) {
      console.error(error)
      setOcupado(false)
      avisar('Não foi possível reiniciar a sala.')
      return
    }

    router.replace(`/sala/${codigo}`)
  }

  async function sair() {
    if (!room || !meuPlayerId) {
      router.push('/')
      return
    }

    setOcupado(true)

    try {
      if (souDaVez && room.second_pick === null) {
        await passarVez({
          room,
          players: players.map((player) =>
            player.id === meuPlayerId
              ? { ...player, connected: false }
              : player
          ),
          onlineIds: online,
        })
      }

      await sairDaSala(room, meuPlayerId, players)
    } catch (error) {
      console.error(error)
    }

    router.push('/')
  }

  /* ---------------------------------------------------------------- */
  /* Renderização                                                     */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return <Carregando texto="Embaralhando as cartas…" />
  }

  if (erro || !room) {
    return (
      <main className="tela-centro">
        <div className="cartao cartao-mensagem">
          <h2>Partida indisponível</h2>
          <p>{erro}</p>
          <button className="btn btn-primario" onClick={() => router.push('/')}>
            Voltar ao início
          </button>
        </div>
      </main>
    )
  }

  if (room.status === 'finished' && !mostrandoUltimoPar) {
    return (
      <>
        <TelaFinal
          room={room}
          players={players}
          cards={cards}
          cor={corTema}
          meuPlayerId={meuPlayerId}
          souHost={souHost}
          ocupado={ocupado}
          onJogarNovamente={jogarNovamente}
          onSair={() => setModal('sair')}
        />

        {modal === 'sair' && (
          <Modal titulo="Sair da sala?" aoFechar={() => setModal(null)}>
            <p className="texto-suave">
              Você não estará na próxima partida desta sala.
            </p>
            <div className="modal-acoes">
              <button className="btn btn-claro" onClick={() => setModal(null)}>
                Ficar
              </button>
              <button className="btn btn-vermelho" onClick={sair} disabled={ocupado}>
                Sair
              </button>
            </div>
          </Modal>
        )}

        <Aviso mensagem={aviso} />
      </>
    )
  }

  const alertaTempo = restante !== null && restante <= 5 && room.second_pick === null
  const faltamCartas = room.first_pick === null ? 'duas cartas' : 'mais uma carta'

  return (
    <main className="jogo">
      <header className="jogo-topo">
        <div className="jogo-topo-esq">
          <Logo compacto />
          <span className="pilula pilula-clara">Sala {codigo}</span>
        </div>

        <div className="jogo-topo-dir">
          <div className="indicador" title="Pares encontrados">
            <span className="indicador-rotulo">Pares</span>
            <strong>
              {resumo.encontrados}
              <small>/{resumo.total}</small>
            </strong>
          </div>

          <div className="indicador" title="Jogadas feitas">
            <span className="indicador-rotulo">Jogadas</span>
            <strong>{resumo.jogadas}</strong>
          </div>

          <div
            className={`relogio ${alertaTempo ? 'alerta' : ''}`}
            title="Tempo da vez"
          >
            {restante === null
              ? '∞'
              : `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`}
          </div>

          <BotaoSom />

          <button
            type="button"
            className="botao-som botao-menu"
            onClick={() => setModal('menu')}
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="jogo-corpo">
        <section className="jogo-principal">
          {/* ------------------------ Painel da vez ------------------------ */}
          <div className="painel-rodada painel-vez">
            <div className="painel-rodada-cabeca">
              <span className="pilula">Jogada {resumo.jogadas + (emJogo ? 1 : 0)}</span>
              <span className="painel-rodada-fase">
                {tema ? `${tema.cover_emoji ?? ''} ${tema.name}`.trim() : ''}
              </span>

              <div className="vez-viradas" aria-hidden="true">
                {[cartaA, cartaB].map((carta, i) => (
                  <span
                    key={`${i}-${carta?.position ?? 'vazia'}`}
                    className={`vez-mini ${
                      !carta
                        ? 'vazia'
                        : jogadaCompleta
                          ? acertou
                            ? 'acertou'
                            : 'errou'
                          : ''
                    }`}
                  >
                    {emJogo && carta ? <FaceCarta card={carta} pequena /> : null}
                  </span>
                ))}
              </div>
            </div>

            {!emJogo && (
              <div className="estado-espera">
                <span className="selo-jogada acertou">Mesa completa!</span>
              </div>
            )}

            {jogadaCompleta && (
              <div className="estado-espera">
                <span className={`selo-jogada ${acertou ? 'acertou' : 'errou'}`}>
                  {acertou ? 'Par!' : 'Não foi dessa vez'}
                </span>
                <p className="estado-titulo">
                  {acertou
                    ? souDaVez
                      ? 'Boa! Você joga de novo.'
                      : `${jogadorDaVez?.name ?? 'Alguém'} achou um par e joga de novo.`
                    : 'Guarde onde elas estão…'}
                </p>
              </div>
            )}

            {emJogo && !jogadaCompleta && souDaVez && (
              <div className="estado-espera">
                <div>
                  <p className="vez-titulo">Sua vez!</p>
                  <p className="texto-suave">
                    Vire {faltamCartas}. Achou um par? Joga de novo.
                  </p>
                </div>
              </div>
            )}

            {emJogo && !jogadaCompleta && !souDaVez && (
              <div className="estado-espera">
                {jogadorDaVez && (
                  <Avatar
                    nome={jogadorDaVez.name}
                    cor={corDoJogador(players, jogadorDaVez.id)}
                    tamanho="lg"
                  />
                )}
                <div>
                  <p className="estado-titulo">
                    <strong>{jogadorDaVez?.name ?? 'Alguém'}</strong> está
                    virando as cartas
                    <span className="pontinhos">
                      <i />
                      <i />
                      <i />
                    </span>
                  </p>
                  <p className="texto-suave">
                    {vezAusente
                      ? 'Parece que saiu da sala. A vez passa já já.'
                      : 'Fique de olho: cada carta virada é uma pista.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------ Mesa ------------------------ */}
          <Mesa
            pares={room.pairs}
            cor={corTema}
            cards={cards}
            players={players}
            primeira={emJogo ? room.first_pick : null}
            segunda={emJogo ? room.second_pick : null}
            podeVirar={souDaVez && room.second_pick === null}
            onVirar={virar}
          />

          <CartaZoom
            cartas={cartasZoom}
            resultado={jogadaCompleta ? (acertou ? 'acertou' : 'errou') : null}
          />
        </section>

        {/* ------------------------ Lateral ------------------------ */}
        <aside className="jogo-lateral">
          <div className="bloco bloco-jogadores">
            <h2 className="bloco-titulo">Jogadores</h2>

            <ul className="lista-jogadores">
              {conectados.map((player) => {
                const daVez = player.id === room.current_player_id && emJogo
                const estaOnline = !online || online.has(player.id)

                return (
                  <li
                    key={player.id}
                    className={`jogador ${daVez ? 'da-vez' : ''} ${
                      estaOnline ? '' : 'offline'
                    }`}
                  >
                    <Avatar
                      nome={player.name}
                      cor={corDoJogador(players, player.id)}
                      online={estaOnline}
                    />

                    <span className="jogador-nome">
                      {player.name}
                      {player.id === meuPlayerId && <em>você</em>}
                    </span>

                    {room.host_id === player.id && (
                      <span className="coroa" title="Anfitrião">
                        ♛
                      </span>
                    )}

                    <span
                      className="placar-pares"
                      title={`${pares.get(player.id) ?? 0} pares`}
                    >
                      {pares.get(player.id) ?? 0}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="bloco bloco-pares">
            <h2 className="bloco-titulo">Pares encontrados</h2>

            {paresAchados.length === 0 ? (
              <p className="texto-suave">
                Nenhum ainda. Cada par vale um ponto para quem achar.
              </p>
            ) : (
              <ul
                className="lista-pares"
                style={{ '--tema': corTema } as CSSProperties}
              >
                {[...paresAchados].reverse().map((card) => {
                  const dono = players.find(
                    (player) => player.id === card.matched_by
                  )

                  return (
                    <li
                      key={card.id}
                      className="par-achado"
                      title={`${card.label ?? ''}${dono ? ` — par de ${dono.name}` : ''}`}
                    >
                      <FaceCarta card={card} pequena />
                      {dono && (
                        <Avatar
                          nome={dono.name}
                          cor={corDoJogador(players, dono.id)}
                          tamanho="sm"
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="bloco bloco-acoes">
            {souHost && emJogo && (
              <>
                {!souDaVez && (
                  <button
                    className="btn btn-claro btn-pequeno"
                    onClick={pularVez}
                    disabled={ocupado || room.second_pick !== null}
                    title="Útil quando alguém saiu ou travou"
                  >
                    Pular a vez de {jogadorDaVez?.name ?? '…'}
                  </button>
                )}
                <button
                  className="btn btn-claro btn-pequeno"
                  onClick={() => setModal('encerrar')}
                  disabled={ocupado}
                >
                  Encerrar partida
                </button>
              </>
            )}

            <button
              className="btn btn-claro btn-pequeno"
              onClick={() => setModal('sair')}
              disabled={ocupado}
            >
              Sair da sala
            </button>
          </div>
        </aside>
      </div>

      {modal === 'menu' && (
        <Modal titulo="Menu" aoFechar={() => setModal(null)}>
          <div className="menu-acoes">
            {souHost && emJogo && (
              <>
                {!souDaVez && (
                  <button
                    className="btn btn-claro"
                    onClick={() => {
                      setModal(null)
                      pularVez()
                    }}
                    disabled={ocupado || room.second_pick !== null}
                  >
                    Pular a vez de {jogadorDaVez?.name ?? '…'}
                  </button>
                )}
                <button
                  className="btn btn-claro"
                  onClick={() => setModal('encerrar')}
                >
                  Encerrar partida
                </button>
              </>
            )}
            <button className="btn btn-vermelho" onClick={() => setModal('sair')}>
              Sair da sala
            </button>
          </div>
        </Modal>
      )}

      {modal === 'sair' && (
        <Modal titulo="Sair da partida?" aoFechar={() => setModal(null)}>
          <p className="texto-suave">
            {souDaVez
              ? 'É a sua vez — ela passa para o próximo jogador.'
              : 'Você não poderá voltar para esta partida.'}{' '}
            Seus pares continuam na mesa.
          </p>
          <div className="modal-acoes">
            <button className="btn btn-claro" onClick={() => setModal(null)}>
              Ficar
            </button>
            <button className="btn btn-vermelho" onClick={sair} disabled={ocupado}>
              Sair
            </button>
          </div>
        </Modal>
      )}

      {modal === 'encerrar' && (
        <Modal titulo="Encerrar a partida?" aoFechar={() => setModal(null)}>
          <p className="texto-suave">
            Todos irão para a tela de resultado com o placar atual.
          </p>
          <div className="modal-acoes">
            <button className="btn btn-claro" onClick={() => setModal(null)}>
              Continuar jogando
            </button>
            <button className="btn btn-vermelho" onClick={encerrar}>
              Encerrar
            </button>
          </div>
        </Modal>
      )}

      <Aviso mensagem={aviso} />
    </main>
  )
}
