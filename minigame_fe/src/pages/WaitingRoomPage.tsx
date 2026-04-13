import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EventFeed } from '../components/EventFeed'
import { PlayerList } from '../components/PlayerList'
import { useRealtimeRoom } from '../hooks/useRealtimeRoom'
import { useRoomPolling } from '../hooks/useRoomPolling'
import { startRoom } from '../services/roomService'
import { socketClient } from '../services/socketClient'
import { useGameStore } from '../store/useGameStore'
import { useRoomStore } from '../store/useRoomStore'
import { useSessionStore } from '../store/useSessionStore'

export function WaitingRoomPage() {
  const navigate = useNavigate()
  const params = useParams<{ roomCode: string }>()
  const roomCode = params.roomCode ?? ''

  const room = useRoomStore((s) => s.room)
  const setRoom = useRoomStore((s) => s.setRoom)
  const setError = useRoomStore((s) => s.setError)
  const error = useRoomStore((s) => s.error)
  const feed = useGameStore((s) => s.feed)
  const isConnected = useGameStore((s) => s.isConnected)
  const nickname = useSessionStore((s) => s.nickname)
  const isHost = useSessionStore((s) => s.isHost)

  useRealtimeRoom(roomCode)
  useRoomPolling(roomCode, true)

  useEffect(() => {
    socketClient.publish(roomCode, {
      eventType: 'PLAYER_JOIN',
      actor: nickname,
      payload: `joined-${Date.now()}`,
    })
  }, [nickname, roomCode])

  useEffect(() => {
    if (room?.status === 'PLAYING') {
      navigate(`/room/${roomCode}/game`)
    }
  }, [navigate, room?.status, roomCode])

  const onStart = async () => {
    try {
      setError(undefined)
      const next = await startRoom(roomCode)
      setRoom(next)
      socketClient.publish(roomCode, {
        eventType: 'START_GAME',
        actor: nickname,
        payload: 'start',
      })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Cannot start game'
      setError(message)
    }
  }

  return (
    <AppShell
      title={`Waiting Room ${roomCode}`}
      subtitle="Host controls game start. Players are synced realtime."
      roomCode={roomCode}
      phase="Waiting"
      role={isHost ? 'Host' : 'Player'}
      connected={isConnected}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="chip">Players {room?.players.length ?? 0}</span>
            <span className="chip chip-brand">Host: {room?.hostNickname ?? '--'}</span>
          </div>

          {room ? <PlayerList players={room.players} /> : <p className="text-slate-400">Loading room...</p>}
          {error ? <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-200">{error}</p> : null}

          {isHost ? (
            <button
              type="button"
              onClick={onStart}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2.5 text-base font-bold hover:from-emerald-500 hover:to-teal-400"
            >
              Start Game Show
            </button>
          ) : (
            <p className="mt-4 rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-300">
              Waiting for host to start...
            </p>
          )}
        </section>

        <EventFeed items={feed} />
      </div>
    </AppShell>
  )
}

