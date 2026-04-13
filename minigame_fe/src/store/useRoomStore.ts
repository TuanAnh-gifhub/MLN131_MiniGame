import { create } from 'zustand'
import type { RoomView } from '../types/room'

interface RoomState {
  room?: RoomView
  loading: boolean
  error?: string
  setRoom: (room: RoomView) => void
  setLoading: (value: boolean) => void
  setError: (message?: string) => void
  clearRoom: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
  room: undefined,
  loading: false,
  error: undefined,
  setRoom: (room) => set({ room, error: undefined }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearRoom: () => set({ room: undefined, loading: false, error: undefined }),
}))

