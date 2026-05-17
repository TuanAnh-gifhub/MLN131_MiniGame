import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PlayerList } from '../components/PlayerList'
import { SpinWheel } from '../components/SpinWheel'
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

  const isHost = room?.hostNickname === nickname
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false)

  const [eventType, setEventType] = useState<GameEventType>('GUESS_LETTER')
  const [payload, setPayload] = useState('')

  useRealtimeRoom(roomCode)
  useRoomPolling(roomCode, true)

  useEffect(() => {
    if (room?.status === 'FINISHED') {
      navigate(`/room/${roomCode}/result`)
    }
  }, [navigate, room?.status, roomCode])

  useEffect(() => {
    const latest = feed[0]
    if (latest?.eventType === 'ADMIN_START_TIMER' || latest?.eventType === 'TURN_CHANGE') {
      const seconds = latest.payload?.timeoutSeconds as number | undefined
      setIsTimerPaused(false) // reset pause state on new timer
      if (seconds) {
        setTimeLeft(seconds)
      } else {
        setTimeLeft(null)
      }
    } else if (latest?.eventType === 'GAME_UPDATE' && latest?.payload?.reason === 'CORRECT_LETTER') {
      const seconds = latest.payload?.timeoutSeconds as number | undefined
      setIsTimerPaused(false)
      if (seconds) {
        setTimeLeft(seconds)
      } else {
        setTimeLeft(45) // fallback
      }
    } else if (latest?.eventType === 'ADMIN_PAUSE_TIMER') {
      const paused = latest.payload?.isPaused as boolean
      setIsTimerPaused(paused)
    }
  }, [feed])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isTimerPaused) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isTimerPaused])

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    socketClient.publish(roomCode, {
      eventType,
      actor: nickname,
      payload,
    })
    setPayload('')
  }

  const isMyTurn = currentTurnPlayerId && playerId ? currentTurnPlayerId === playerId : false
  const currentPlayerName = room?.players.find((p) => p.id === currentTurnPlayerId)?.nickname ?? 'Đang chờ...'
  const usedLetters = new Set((room?.usedLetters ?? '').split(',').map((item) => item.trim()).filter(Boolean))
  
  const wrongGuessersStr = (feed[0]?.payload?.wrongGuessers as string) ?? room?.wrongGuessers ?? ''
  const wrongGuessersSet = new Set(wrongGuessersStr.split(',').map(item => item.trim()).filter(Boolean))
  const canBuzzIn = playerId ? !wrongGuessersSet.has(playerId) : false

  const handleBuzzIn = () => {
    const answer = window.prompt('🔔 RUNG CHUÔNG! Nhập đáp án toàn bộ của bạn:\n(CẢNH BÁO: Đoán sai sẽ bị mất toàn bộ điểm và mất lượt!)')
    if (answer && answer.trim()) {
      socketClient.publish(roomCode, {
        eventType: 'GUESS_ANSWER',
        actor: nickname,
        payload: answer.trim(),
      })
    }
  }

  return (
    <AppShell
      title={`Game Room ${roomCode}`}
      subtitle="Realtime turn-based gameplay via STOMP events."
      roomCode={roomCode}
      phase="Playing"
      role={isMyTurn ? 'Your Turn' : 'Waiting Turn'}
      connected={isConnected}
    >
      <div className="mx-auto max-w-3xl">
        <section className="space-y-4 rounded-2xl border-2 border-yellow-500/30 bg-red-900/90 p-4 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
          <div className="grid gap-2 rounded-xl border border-yellow-400/40 bg-red-800/50 p-4 text-sm text-yellow-50 shadow-inner">
            <p className="text-lg">
              <span className="font-bold text-yellow-300 uppercase">Chủ đề:</span> <span className="font-semibold text-white">{room?.clue ?? 'Đang chờ câu hỏi...'}</span>
            </p>
            <p className="text-xl">
              <span className="font-bold text-yellow-300 uppercase">Đáp án:</span> <span className="font-mono text-2xl font-bold tracking-[0.25em] text-white drop-shadow-md">{room?.maskedAnswer ?? '--'}</span>
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/40 bg-gradient-to-r from-red-800 to-red-900 p-3 text-sm text-yellow-100 flex justify-between items-center shadow-md">
            <span className="text-base">Đang đến lượt của: <strong className="text-yellow-400 text-lg uppercase tracking-wide">{currentPlayerName}</strong></span>
            <div className="flex gap-4 items-center">
              {timeLeft !== null && (
                <span className="font-mono text-2xl font-black text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  {timeLeft}s
                </span>
              )}
              <button
                type="button"
                onClick={handleBuzzIn}
                disabled={!canBuzzIn}
                className="rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border-2 border-yellow-300 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 disabled:from-slate-500 disabled:to-slate-700 p-2 text-xl shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
                title={canBuzzIn ? 'Nhấn chuông để đoán toàn bộ đáp án!' : 'Bạn đã đoán sai vòng này!'}
              >
                🔔
              </button>
            </div>
          </div>

          {isHost && (
            <div className="rounded-xl border border-yellow-500/50 bg-red-950/80 p-3 flex gap-3 shadow-inner">
              <span className="text-sm font-bold text-yellow-200 self-center uppercase tracking-wider">Quản trị:</span>
              <button
                type="button"
                className="rounded bg-gradient-to-r from-red-600 to-red-700 border border-red-500 px-3 py-1 text-sm font-bold text-white hover:from-red-500 hover:to-red-600 shadow-sm"
                onClick={() => socketClient.publish(roomCode, { eventType: 'ADMIN_START_TIMER', actor: nickname })}
              >
                Bắt đầu
              </button>
              <button
                type="button"
                className="rounded bg-gradient-to-r from-yellow-600 to-yellow-700 border border-yellow-500 px-3 py-1 text-sm font-bold text-white hover:from-yellow-500 hover:to-yellow-600 shadow-sm"
                onClick={() => socketClient.publish(roomCode, { eventType: 'ADMIN_PAUSE_TIMER', actor: nickname, payload: (!isTimerPaused).toString() })}
              >
                {isTimerPaused ? 'Tiếp tục' : 'Tạm dừng'}
              </button>
              <button
                type="button"
                className="rounded bg-gradient-to-r from-orange-600 to-orange-700 border border-orange-500 px-3 py-1 text-sm font-bold text-white hover:from-orange-500 hover:to-orange-600 shadow-sm"
                onClick={() => socketClient.publish(roomCode, { eventType: 'ADMIN_SKIP_TURN', actor: nickname })}
              >
                Qua lượt
              </button>
            </div>
          )}

          <div className="rounded-xl border border-yellow-500/30 bg-red-950/60 p-4 shadow-inner">
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-300">Bảng Chữ Cái</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {GAME_ALPHABET.split('').map((letter) => {
                const used = usedLetters.has(letter)
                return (
                  <button
                    key={letter}
                    onClick={() => {
                      if (!isMyTurn || used) return
                      socketClient.publish(roomCode, {
                        eventType: 'GUESS_LETTER',
                        actor: nickname,
                        payload: letter,
                      })
                    }}
                    disabled={!isMyTurn || used || (isMyTurn && spinRequired)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 font-bold transition-all ${
                      used
                        ? 'border-red-900 bg-red-950 text-red-800 opacity-50'
                        : isMyTurn && !spinRequired
                          ? 'border-yellow-400 bg-gradient-to-b from-yellow-500 to-yellow-600 text-red-950 hover:scale-110 hover:shadow-[0_0_10px_rgba(234,179,8,0.6)] cursor-pointer'
                          : 'border-red-800 bg-red-900 text-red-300'
                    }`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          <SpinWheel
            roomCode={roomCode}
            nickname={nickname}
            isMyTurn={isMyTurn}
            spinRequired={spinRequired}
            latestEvent={feed[0]}
          />

          {room ? <PlayerList players={room.players} currentTurnPlayerId={currentTurnPlayerId} /> : null}
        </section>
      </div>
    </AppShell>
  )
}

