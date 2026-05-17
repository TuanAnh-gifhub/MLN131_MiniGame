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
      title={`PHÒNG CHỜ ${roomCode}`}
      subtitle="Chủ phòng sẽ bắt đầu trò chơi. Vui lòng chờ..."
      roomCode={roomCode}
      phase="Waiting"
      role={isHost ? 'Host' : 'Player'}
      connected={isConnected}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border-2 border-yellow-500/40 bg-red-900/90 p-6 shadow-[0_0_25px_rgba(234,179,8,0.2)]">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="chip">Người chơi: {room?.players.length ?? 0}</span>
            <span className="chip chip-brand">Quản trò: {room?.hostNickname ?? '--'}</span>
          </div>

          {room ? <PlayerList players={room.players} /> : <p className="text-yellow-200/60 font-medium">Đang tải phòng...</p>}
          {error ? <p className="mt-3 rounded-lg border-2 border-orange-500/50 bg-orange-500/20 p-3 text-sm font-bold text-orange-200">{error}</p> : null}

          {isHost ? (
            <button
              type="button"
              onClick={onStart}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-yellow-400 px-4 py-3 text-lg font-black uppercase tracking-widest text-red-950 shadow-lg transition-all hover:scale-[1.02] hover:from-yellow-400 hover:to-yellow-500 active:scale-95"
            >
              BẮT ĐẦU TRÒ CHƠI
            </button>
          ) : (
            <p className="mt-6 rounded-xl border border-yellow-500/30 bg-red-950/60 p-4 text-center font-bold tracking-wide text-yellow-300 animate-pulse shadow-inner">
              Đang chờ Quản trò bắt đầu...
            </p>
          )}
        </section>

        <EventFeed items={feed} />
      </div>
    </AppShell>
  )
}

