import { create } from 'zustand'
import type { GameOutboundMessage } from '../types/socket'

interface GameState {
  isConnected: boolean
  currentTurnPlayerId?: string
  feed: GameOutboundMessage[]
  setConnected: (value: boolean) => void
  setCurrentTurnPlayerId: (playerId?: string) => void
  pushFeed: (event: GameOutboundMessage) => void
  clear: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  isConnected: false,
  currentTurnPlayerId: undefined,
  feed: [],
  setConnected: (isConnected) => set({ isConnected }),
  setCurrentTurnPlayerId: (currentTurnPlayerId) => set({ currentTurnPlayerId }),
  pushFeed: (event) => {
    const nextFeed = [event, ...get().feed].slice(0, 50)
    set({ feed: nextFeed })
  },
  clear: () => set({ isConnected: false, currentTurnPlayerId: undefined, feed: [] }),
}))

