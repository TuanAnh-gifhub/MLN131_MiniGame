import { create } from 'zustand'

interface SessionState {
  nickname: string
  roomCode: string
  token: string
  isHost: boolean
  playerId?: string
  setSession: (payload: {
    nickname: string
    roomCode: string
    token: string
    isHost: boolean
    playerId?: string
  }) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  nickname: '',
  roomCode: '',
  token: '',
  isHost: false,
  playerId: undefined,
  setSession: (payload) => set(payload),
  clearSession: () =>
    set({
      nickname: '',
      roomCode: '',
      token: '',
      isHost: false,
      playerId: undefined,
    }),
}))

