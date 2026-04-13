export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED'

export interface PlayerView {
  id: string
  nickname: string
  score: number
  host: boolean
  ready: boolean
  connected: boolean
}

export interface RoomView {
  id: string
  code: string
  hostNickname: string
  status: RoomStatus
  players: PlayerView[]
  currentTurnPlayerId?: string
  currentRound?: number
  totalRounds?: number
  clue?: string
  maskedAnswer?: string
  usedLetters?: string
  lastTurnAt?: string
  spinRequired?: boolean
  currentSpinScore?: number
}

export interface AdminQuestionInput {
  category: string
  clue: string
  answer: string
}

export interface AdminCreateRoomInput {
  hostNickname: string
  roomCode?: string
  questions: AdminQuestionInput[]
}

export interface ApiErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}

