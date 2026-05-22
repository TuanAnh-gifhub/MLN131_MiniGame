import { useEffect } from 'react'
import { getRoom } from '../services/roomService'
import { socketClient } from '../services/socketClient'
import { useGameStore } from '../store/useGameStore'
import { useRoomStore } from '../store/useRoomStore'
import { useSessionStore } from '../store/useSessionStore'
import type { GameOutboundMessage } from '../types/socket'

export function useRealtimeRoom(roomCode: string): void {
  const token = useSessionStore((s) => s.token)
  const setRoom = useRoomStore((s) => s.setRoom)
  const setError = useRoomStore((s) => s.setError)
  const setConnected = useGameStore((s) => s.setConnected)
  const setCurrentTurnPlayerId = useGameStore((s) => s.setCurrentTurnPlayerId)
  const pushFeed = useGameStore((s) => s.pushFeed)

  useEffect(() => {
    if (!roomCode) {
      return
    }

    const onMessage = async (message: GameOutboundMessage) => {
      pushFeed(message)
      if (message.eventType === 'TURN_CHANGE') {
        const nextPlayerId = typeof message.payload?.nextPlayerId === 'string' ? message.payload.nextPlayerId : undefined
        setCurrentTurnPlayerId(nextPlayerId)
      }

      try {
        const room = await getRoom(roomCode)
        setRoom(room)
      } catch {
        // Ignore transient fetch failures.
      }
    }

    socketClient
      .connect(onMessage, roomCode, token)
      .then(() => setConnected(true))
      .catch((error: Error) => {
        setError(error.message)
        setConnected(false)
      })

    return () => {
      setConnected(false)
      socketClient.disconnect()
    }
  }, [pushFeed, roomCode, setConnected, setCurrentTurnPlayerId, setError, setRoom, token])
}

