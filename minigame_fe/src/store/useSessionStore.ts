import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

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

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'minigame-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nickname: state.nickname,
        roomCode: state.roomCode,
        token: state.token,
        isHost: state.isHost,
        playerId: state.playerId,
      }),
    },
  ),
)

