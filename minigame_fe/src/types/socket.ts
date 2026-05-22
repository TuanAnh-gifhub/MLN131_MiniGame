export type GameEventType =
  | 'PLAYER_JOIN'
  | 'PLAYER_READY'
  | 'START_GAME'
  | 'RING_BELL'
  | 'GUESS_LETTER'
  | 'GUESS_ANSWER'
  | 'TURN_CHANGE'
  | 'GAME_UPDATE'
  | 'ROUND_END'
  | 'GAME_END'
  | 'ADMIN_PAUSE'
  | 'ADMIN_RESUME'
  | 'ADMIN_END'
  | 'ADMIN_SKIP_TURN'
  | 'ADMIN_SKIP_QUESTION'
  | 'ADMIN_RESET_BELL'
  | 'ADMIN_KICK_PLAYER'

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
    spinScore?: number
    reason?: string
    currentRound?: number
    totalRounds?: number
    targetPlayerId?: string
    targetNickname?: string
    winnerId?: string
    winnerNickname?: string
    actorNickname?: string
    [key: string]: unknown
  }
  serverTime: string
}

