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
    actorNickname?: string
    reason?: string
    currentRound?: number
    totalRounds?: number
    [key: string]: unknown
  }
  serverTime: string
}

