import { supabase } from '@/lib/supabase'
import { urlArte } from '@/lib/temas'
import type { Card, Player, Room, ThemeItem } from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Identidade local do jogador                                         */
/* ------------------------------------------------------------------ */

function chaveJogador(codigoSala: string) {
  return `que-memoria-player-${codigoSala.toUpperCase()}`
}

export function salvarJogador(
  codigoSala: string,
  playerId: string
) {
  localStorage.setItem(
    chaveJogador(codigoSala),
    playerId
  )
}

export function obterJogador(codigoSala: string) {
  if (typeof window === 'undefined') return null

  return localStorage.getItem(
    chaveJogador(codigoSala)
  )
}

export function esquecerJogador(codigoSala: string) {
  localStorage.removeItem(chaveJogador(codigoSala))
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export class ErroJogo extends Error {}

export function gerarCodigoSala(tamanho = 6) {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  let codigo = ''

  for (let i = 0; i < tamanho; i++) {
    codigo += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    )
  }

  return codigo
}

/** Fisher–Yates: embaralhamento sem viés. */
export function embaralhar<T>(lista: T[]) {
  const copia = [...lista]

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }

  return copia
}

export function formatarTempo(segundos: number | null) {
  if (segundos === null) return 'Ilimitado'
  if (segundos < 60) return `${segundos} s`

  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60

  if (resto === 0) return `${minutos} min`

  return `${minutos}:${String(resto).padStart(2, '0')}`
}

/** Duração em mm:ss (ou h:mm:ss). */
export function formatarDuracao(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000))
  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundos = String(total % 60).padStart(2, '0')

  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, '0')}:${segundos}`
  }

  return `${minutos}:${segundos}`
}

/** Cores fixas para os avatares, na ordem de entrada. */
const CORES_AVATAR = [
  '#3b6fd8',
  '#ec6a8c',
  '#f2a93b',
  '#2fb487',
  '#8b5cf6',
  '#ef5b3f',
  '#14a3b8',
  '#b4568f',
]

export function corDoJogador(
  players: Player[],
  playerId: string | null
) {
  const indice = ordenarJogadores(players).findIndex(
    (player) => player.id === playerId
  )

  return CORES_AVATAR[
    Math.max(0, indice) % CORES_AVATAR.length
  ]
}

/* ------------------------------------------------------------------ */
/* Regras                                                              */
/* ------------------------------------------------------------------ */

/** Tempo que as duas cartas ficam à mostra antes de desvirar (ou sumir). */
export const TEMPO_REVELACAO_MS = 2200

/** Folga para outro aparelho resolver a jogada, se quem jogou cair. */
export const FOLGA_RESERVA_MS = 4000

export function ordenarJogadores(players: Player[]) {
  return [...players].sort((a, b) => {
    const ordemA = a.player_order ?? Number.MAX_SAFE_INTEGER
    const ordemB = b.player_order ?? Number.MAX_SAFE_INTEGER

    if (ordemA !== ordemB) return ordemA - ordemB

    return a.joined_at.localeCompare(b.joined_at)
  })
}

export function ordenarCartas(cards: Card[]) {
  return [...cards].sort((a, b) => a.position - b.position)
}

/** Pares encontrados por cada jogador (cada par = duas cartas). */
export function paresPorJogador(cards: Card[]) {
  const pares = new Map<string, number>()

  for (const card of cards) {
    if (!card.matched_by) continue
    pares.set(card.matched_by, (pares.get(card.matched_by) ?? 0) + 0.5)
  }

  return pares
}

export function resumoPartida(
  room: Pick<Room, 'pairs' | 'moves'>,
  cards: Card[]
) {
  const encontrados =
    cards.filter((card) => card.matched_by).length / 2

  return {
    total: room.pairs,
    encontrados,
    restantes: room.pairs - encontrados,
    jogadas: room.moves,
  }
}

/** Nota da partida pela eficiência: pares ÷ jogadas. */
export function classificacao(pares: number, jogadas: number) {
  const taxa = jogadas === 0 ? 0 : pares / jogadas

  if (jogadas > 0 && pares === jogadas) {
    return {
      titulo: 'Memória de elefante',
      texto: 'Nenhuma jogada desperdiçada. Impressionante!',
    }
  }

  if (taxa >= 0.6) {
    return {
      titulo: 'Memória afiada',
      texto: 'Quase não erraram. Que cabeça!',
    }
  }

  if (taxa >= 0.4) {
    return {
      titulo: 'Boa memória',
      texto: 'Lembraram de bastante coisa.',
    }
  }

  if (taxa >= 0.25) {
    return {
      titulo: 'Memória de peixinho',
      texto: 'Volta e meia a carta fugiu da cabeça.',
    }
  }

  return {
    titulo: 'Que memória?',
    texto: 'Quem nunca esqueceu onde deixou a chave?',
  }
}

/**
 * Próximo jogador na ordem, pulando quem saiu (e quem está offline,
 * quando sabemos quem está online).
 */
export function proximoJogador(
  players: Player[],
  atualId: string | null,
  onlineIds: Set<string> | null
) {
  const ordenados = ordenarJogadores(players)

  let candidatos = ordenados.filter(
    (player) =>
      player.connected &&
      (!onlineIds || onlineIds.has(player.id))
  )

  if (candidatos.length === 0) {
    candidatos = ordenados.filter((player) => player.connected)
  }

  if (candidatos.length === 0) return null

  const indiceAtual = ordenados.findIndex(
    (player) => player.id === atualId
  )

  for (let passo = 1; passo <= ordenados.length; passo++) {
    const candidato =
      ordenados[(indiceAtual + passo) % ordenados.length]

    if (candidatos.includes(candidato)) return candidato
  }

  return candidatos[0]
}

/* ------------------------------------------------------------------ */
/* Ações no banco                                                      */
/* ------------------------------------------------------------------ */

const JOGADA_LIMPA = {
  first_pick: null,
  second_pick: null,
  picked_at: null,
}

/**
 * Vira uma carta. Só vale se ainda for a mesma vez (turn_number) e se a
 * casa da jogada estiver livre — evita cliques duplos e estado velho.
 * Retorna os campos alterados, ou null se a jogada não valeu.
 */
export async function virarCarta(
  room: Room,
  playerId: string,
  posicao: number
) {
  let consulta

  if (room.first_pick === null) {
    consulta = supabase
      .from('que_memoria_rooms')
      .update({ first_pick: posicao })
      .is('first_pick', null)
  } else if (room.second_pick === null && room.first_pick !== posicao) {
    consulta = supabase
      .from('que_memoria_rooms')
      .update({
        second_pick: posicao,
        picked_at: new Date().toISOString(),
      })
      .eq('first_pick', room.first_pick)
      .is('second_pick', null)
  } else {
    return null
  }

  const { data, error } = await consulta
    .eq('id', room.id)
    .eq('status', 'playing')
    .eq('current_player_id', playerId)
    .eq('turn_number', room.turn_number)
    .select()

  if (error) throw error

  return (data?.[0] as Room | undefined) ?? null
}

export async function finalizarPartida(roomId: string) {
  const { error } = await supabase
    .from('que_memoria_rooms')
    .update({
      ...JOGADA_LIMPA,
      status: 'finished',
      finished_at: new Date().toISOString(),
    })
    .eq('id', roomId)
    .eq('status', 'playing')

  if (error) throw error
}

/**
 * Depois da revelação: marca o par (se houver) e decide quem joga.
 * Acertou → joga de novo. Errou → passa a vez.
 * Retorna false se a jogada ainda não estava no banco (tentar de novo).
 */
export async function resolverJogada({
  room,
  cards,
  players,
  onlineIds,
}: {
  room: Room
  cards: Card[]
  players: Player[]
  onlineIds: Set<string> | null
}) {
  const { first_pick: a, second_pick: b } = room

  if (a === null || b === null) return true

  const cartaA = cards.find((card) => card.position === a)
  const cartaB = cards.find((card) => card.position === b)

  if (!cartaA || !cartaB) return false

  const acertou = cartaA.symbol === cartaB.symbol

  // Confere no banco que a jogada é mesmo esta (e não um estado só local)
  const { data: confirmada, error: confirmarError } = await supabase
    .from('que_memoria_rooms')
    .select('id')
    .eq('id', room.id)
    .eq('status', 'playing')
    .eq('turn_number', room.turn_number)
    .eq('first_pick', a)
    .eq('second_pick', b)
    .maybeSingle()

  if (confirmarError) throw confirmarError
  if (!confirmada) return false

  if (acertou && room.current_player_id) {
    // Idempotente: só marca cartas ainda livres
    const { error } = await supabase
      .from('que_memoria_cards')
      .update({
        matched_by: room.current_player_id,
        matched_at: new Date().toISOString(),
      })
      .eq('room_id', room.id)
      .in('position', [a, b])
      .is('matched_by', null)

    if (error) throw error
  }

  const restantes = cards.filter(
    (card) =>
      !card.matched_by &&
      !(acertou && (card.position === a || card.position === b))
  ).length

  const proximo = acertou
    ? room.current_player_id
    : proximoJogador(players, room.current_player_id, onlineIds)?.id ??
      room.current_player_id

  const agora = new Date().toISOString()

  const { error } = await supabase
    .from('que_memoria_rooms')
    .update({
      ...JOGADA_LIMPA,
      current_player_id: proximo,
      turn_number: room.turn_number + 1,
      moves: room.moves + 1,
      turn_started_at: agora,
      ...(restantes === 0
        ? { status: 'finished', finished_at: agora }
        : {}),
    })
    .eq('id', room.id)
    .eq('status', 'playing')
    .eq('turn_number', room.turn_number)

  if (error) throw error

  return true
}

/** Passa a vez sem jogada completa (tempo esgotado, pulada, saiu). */
export async function passarVez({
  room,
  players,
  onlineIds,
}: {
  room: Room
  players: Player[]
  onlineIds: Set<string> | null
}) {
  const proximo = proximoJogador(
    players,
    room.current_player_id,
    onlineIds
  )

  if (!proximo) {
    await finalizarPartida(room.id)
    return
  }

  const { error } = await supabase
    .from('que_memoria_rooms')
    .update({
      ...JOGADA_LIMPA,
      current_player_id: proximo.id,
      turn_number: room.turn_number + 1,
      turn_started_at: new Date().toISOString(),
    })
    .eq('id', room.id)
    .eq('status', 'playing')
    .eq('turn_number', room.turn_number)

  if (error) throw error
}

export async function iniciarPartida(room: Room) {
  const { data: jogadores, error: jogadoresError } =
    await supabase
      .from('que_memoria_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('connected', true)

  if (jogadoresError) throw jogadoresError

  if (!jogadores || jogadores.length === 0) {
    throw new ErroJogo('Ninguém na sala para jogar.')
  }

  const { data: itens, error: itensError } = await supabase
    .from('que_memoria_theme_items')
    .select('id, name, emoji, image_path')
    .eq('theme_id', room.theme)
    .eq('active', true)
    .range(0, 999)

  if (itensError) throw itensError

  if (!itens || itens.length < room.pairs) {
    throw new ErroJogo(
      `Esse tema tem ${itens?.length ?? 0} cartas; a mesa precisa de ${room.pairs}.`
    )
  }

  // Cada item vira um par; a carta leva uma cópia do nome, emoji e arte
  const sorteados = embaralhar(itens as ThemeItem[]).slice(0, room.pairs)
  const baralho = embaralhar([...sorteados, ...sorteados])

  // Limpa a mesa de uma partida anterior da mesma sala
  const { error: limparCartas } = await supabase
    .from('que_memoria_cards')
    .delete()
    .eq('room_id', room.id)

  if (limparCartas) throw limparCartas

  const { error: cartasError } = await supabase
    .from('que_memoria_cards')
    .insert(
      baralho.map((item, position) => ({
        room_id: room.id,
        position,
        symbol: item.id,
        label: item.name,
        emoji: item.emoji,
        image_url: urlArte(item.image_path),
      }))
    )

  if (cartasError) throw cartasError

  const primeiro =
    jogadores[Math.floor(Math.random() * jogadores.length)] as Player
  const agora = new Date().toISOString()

  const { error: roomError } = await supabase
    .from('que_memoria_rooms')
    .update({
      ...JOGADA_LIMPA,
      status: 'playing',
      current_player_id: primeiro.id,
      turn_number: room.turn_number + 1,
      moves: 0,
      turn_started_at: agora,
      started_at: agora,
      finished_at: null,
    })
    .eq('id', room.id)

  if (roomError) throw roomError
}

/** Marca o jogador como fora da sala e passa a coroa, se ele for o host. */
export async function sairDaSala(
  room: Room,
  playerId: string,
  players: Player[]
) {
  await supabase
    .from('que_memoria_players')
    .update({ connected: false, is_host: false })
    .eq('id', playerId)

  if (room.host_id === playerId) {
    const novoHost = ordenarJogadores(players).find(
      (player) => player.connected && player.id !== playerId
    )

    if (novoHost) {
      await supabase
        .from('que_memoria_players')
        .update({ is_host: true })
        .eq('id', novoHost.id)

      await supabase
        .from('que_memoria_rooms')
        .update({ host_id: novoHost.id })
        .eq('id', room.id)
    }
  }

  esquecerJogador(room.code)
}
