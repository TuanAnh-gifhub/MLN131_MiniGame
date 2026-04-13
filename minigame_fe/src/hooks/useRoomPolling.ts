import { useEffect } from 'react'
import { getRoom } from '../services/roomService'
import { useRoomStore } from '../store/useRoomStore'

export function useRoomPolling(roomCode: string, enabled = true): void {
  const setRoom = useRoomStore((s) => s.setRoom)

  useEffect(() => {
    if (!enabled || !roomCode) {
      return
    }

    const timer = window.setInterval(async () => {
      try {
        const room = await getRoom(roomCode)
        setRoom(room)
      } catch {
        // Best-effort polling fallback when websocket events are sparse.
      }
    }, 3000)

    return () => window.clearInterval(timer)
  }, [enabled, roomCode, setRoom])
}

