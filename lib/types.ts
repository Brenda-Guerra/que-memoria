export type RoomStatus = 'waiting' | 'playing' | 'finished'

export type Room = {
  id: string
  code: string
  host_id: string | null
  /** quantidade de pares na mesa (peças = pares × 2) */
  pairs: number
  theme: string
  turn_time: number | null
  status: RoomStatus
  current_player_id: string | null
  /** posições das cartas viradas na jogada atual */
  first_pick: number | null
  second_pick: number | null
  /** quando a segunda carta foi virada (início da revelação) */
  picked_at: string | null
  /** versão da vez: muda a cada troca, evita resolver a mesma jogada duas vezes */
  turn_number: number
  /** jogadas completas (duas cartas viradas) na partida */
  moves: number
  turn_started_at: string | null
  started_at: string | null
  finished_at: string | null
}

export type Player = {
  id: string
  room_id: string
  name: string
  player_order: number | null
  connected: boolean
  is_host: boolean
  joined_at: string
}

export type Card = {
  id: string
  room_id: string
  position: number
  symbol: string
  matched_by: string | null
  matched_at: string | null
  /** cópia do item do tema: nome, emoji ou arte */
  label: string | null
  emoji: string | null
  image_url: string | null
}

export type ThemeKind = 'emoji' | 'image'

export type Theme = {
  id: string
  name: string
  kind: ThemeKind
  cover_emoji: string | null
  cover_path: string | null
  color: string
  sort_order: number
}

export type ThemeItem = {
  id: string
  theme_id: string
  slug: string
  name: string
  emoji: string | null
  image_path: string | null
}
