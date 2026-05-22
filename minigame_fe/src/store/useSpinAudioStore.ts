import { create } from 'zustand'

interface SpinAudioState {
  volume: number
  muted: boolean
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  toggleMuted: () => void
}

export const useSpinAudioStore = create<SpinAudioState>((set) => ({
  volume: 1,
  muted: false,
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ muted }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
}))
