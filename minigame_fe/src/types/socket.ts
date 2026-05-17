export type GameEventType =
  | 'PLAYER_JOIN'
  | 'PLAYER_READY'
  | 'START_GAME'
  | 'GUESS_LETTER'
  | 'GUESS_ANSWER'
  | 'TURN_CHANGE'
  | 'GAME_UPDATE'
  | 'GAME_END'
  | 'ADMIN_SKIP_TURN'
  | 'ADMIN_START_TIMER'
  | 'ADMIN_PAUSE_TIMER'

export interface GameInboundMessage {
  eventType: GameEventType
  actor: string
  payload?: string
}

export interface GameOutboundMessage {
  eventType: GameEventType
  roomCode: string
  actor: string
  payload?: {
    content?: string
    nextPlayerId?: string
    timeoutSeconds?: number
    [key: string]: unknown
  }
  serverTime: string
}

