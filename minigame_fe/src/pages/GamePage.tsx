import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { EventFeed } from '../components/EventFeed'
import { PlayerList } from '../components/PlayerList'
import { useRealtimeRoom } from '../hooks/useRealtimeRoom'
import { useRoomPolling } from '../hooks/useRoomPolling'
import { socketClient } from '../services/socketClient'
import { useGameStore } from '../store/useGameStore'
import { useRoomStore } from '../store/useRoomStore'
import { useSessionStore } from '../store/useSessionStore'
import type { GameEventType } from '../types/socket'

const GAME_ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVXY'

export function GamePage() {
  const navigate = useNavigate()
  const params = useParams<{ roomCode: string }>()
  const roomCode = params.roomCode ?? ''

  const room = useRoomStore((s) => s.room)
  const currentTurnPlayerId = useGameStore((s) => s.currentTurnPlayerId)
  const isConnected = useGameStore((s) => s.isConnected)
  const feed = useGameStore((s) => s.feed)
  const nickname = useSessionStore((s) => s.nickname)
  const playerId = useSessionStore((s) => s.playerId)

  const [eventType, setEventType] = useState<GameEventType>('GUESS_LETTER')
  const [payload, setPayload] = useState('')
  const [spinPoint, setSpinPoint] = useState<number | null>(null)

  useRealtimeRoom(roomCode)
  useRoomPolling(roomCode, true)

  useEffect(() => {
    if (room?.status === 'FINISHED') {
      navigate(`/room/${roomCode}/result`)
    }
  }, [navigate, room?.status, roomCode])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    socketClient.publish(roomCode, {
      eventType,
      actor: nickname,
      payload,
    })
    setPayload('')
  }

  const onSpinWheel = () => {
    const pointOptions = [100, 200, 300, 400, 500, 600, 700, 800]
    const rolled = pointOptions[Math.floor(Math.random() * pointOptions.length)]
    setSpinPoint(rolled)
    setPayload(`SPIN:${rolled}`)
  }

  const isMyTurn = currentTurnPlayerId && playerId ? currentTurnPlayerId === playerId : false
  const usedLetters = new Set((room?.usedLetters ?? '').split(',').map((item) => item.trim()).filter(Boolean))

  return (
    <AppShell
      title={`Game Room ${roomCode}`}
      subtitle="Realtime turn-based gameplay via STOMP events."
      roomCode={roomCode}
      phase="Playing"
      role={isMyTurn ? 'Your Turn' : 'Waiting Turn'}
      connected={isConnected}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
          <div className="grid gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            <p>
              Clue: <span className="font-semibold">{room?.clue ?? 'Dang cho cau hoi...'}</span>
            </p>
            <p>
              Puzzle: <span className="font-mono text-base tracking-[0.2em]">{room?.maskedAnswer ?? '--'}</span>
            </p>
          </div>

          <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            Current Turn Player ID: {currentTurnPlayerId ?? 'Waiting for scheduler event...'}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Alphabet (24 letters)</p>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
              {GAME_ALPHABET.split('').map((letter) => {
                const used = usedLetters.has(letter)
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => {
                      setEventType('GUESS_LETTER')
                      setPayload(letter)
                    }}
                    disabled={used}
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200 disabled:opacity-40"
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onSpinWheel}
              className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2 font-semibold text-fuchsia-100 hover:bg-fuchsia-500/20"
            >
              Spin Wheel
            </button>
            <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200">
              Last spin: <span className="font-bold text-amber-200">{spinPoint ?? '--'}</span>
            </div>
          </div>

          {room ? <PlayerList players={room.players} currentTurnPlayerId={currentTurnPlayerId} /> : null}

          <form className="grid gap-3" onSubmit={onSubmit}>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as GameEventType)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="GUESS_LETTER">GUESS_LETTER</option>
              <option value="GUESS_ANSWER">GUESS_ANSWER</option>
              <option value="GAME_UPDATE">GAME_UPDATE</option>
              <option value="GAME_END">GAME_END</option>
            </select>
            <input
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Payload"
            />
            <button
              className="rounded-lg bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2 font-semibold hover:from-brand-500 hover:to-indigo-400 disabled:opacity-50"
              type="submit"
              disabled={!payload.trim()}
            >
              Send Event
            </button>
          </form>
        </section>

        <EventFeed items={feed} />
      </div>
    </AppShell>
  )
}

