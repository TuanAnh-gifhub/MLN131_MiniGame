import { FormEvent, useEffect, useMemo, useState } from 'react'
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
const GAME_ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVXY'
const TURN_TIMEOUT_SECONDS = 30
const SPIN_OUTCOMES = [100, 200, 300, 400, 500, 600, 700, 800, 0, -1]

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
  const isHost = useSessionStore((s) => s.isHost)

  const [fullAnswer, setFullAnswer] = useState('')
  const [remainingSeconds, setRemainingSeconds] = useState(TURN_TIMEOUT_SECONDS)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelResult, setWheelResult] = useState<number | null>(null)
  const [bellActor, setBellActor] = useState<string>()

  useRealtimeRoom(roomCode)
  useRoomPolling(roomCode, true)

  useEffect(() => {
    if (room?.status === 'FINISHED') {
      navigate(`/room/${roomCode}/result`)
    }
  }, [navigate, room?.status, roomCode])

  const isMyTurn = currentTurnPlayerId && playerId ? currentTurnPlayerId === playerId : false
  const isObserver = isHost && !playerId
  const canPlay = Boolean(playerId) && isMyTurn

  const usedLetters = useMemo(
    () => new Set((room?.usedLetters ?? '').split(',').map((item) => item.trim()).filter(Boolean)),
    [room?.usedLetters],
  )

  const turnPlayerName = useMemo(() => {
    if (!room?.players?.length || !currentTurnPlayerId) {
      return undefined
    }
    return room.players.find((player) => player.id === currentTurnPlayerId)?.nickname
  }, [currentTurnPlayerId, room?.players])

  useEffect(() => {
    if (!room?.lastTurnAt || !currentTurnPlayerId) {
      setRemainingSeconds(TURN_TIMEOUT_SECONDS)
      return
    }

    const lastTurnMs = new Date(room.lastTurnAt).getTime()

    const tick = () => {
      const elapsed = Math.floor((Date.now() - lastTurnMs) / 1000)
      setRemainingSeconds(Math.max(0, TURN_TIMEOUT_SECONDS - elapsed))
    }

    tick()
    const timerId = window.setInterval(tick, 1000)
    return () => window.clearInterval(timerId)
  }, [currentTurnPlayerId, room?.lastTurnAt])

  useEffect(() => {
    const latest = feed[0]
    if (!latest || latest.eventType !== 'GAME_UPDATE') {
      return
    }

    const spinScore = latest.payload?.spinScore
    if (typeof spinScore !== 'number') {
      return
    }

    const outcomeIndex = SPIN_OUTCOMES.indexOf(spinScore)
    if (outcomeIndex < 0) {
      return
    }

    const segmentAngle = 360 / SPIN_OUTCOMES.length
    setWheelResult(spinScore)
    setWheelSpinning(true)
    setWheelRotation((prev) => prev + 1080 + outcomeIndex * segmentAngle + segmentAngle / 2)

    const timerId = window.setTimeout(() => setWheelSpinning(false), 2600)
    return () => window.clearTimeout(timerId)
  }, [feed])

  useEffect(() => {
    const latest = feed[0]
    if (!latest) {
      return
    }

    if (latest.eventType === 'RING_BELL') {
      setBellActor(latest.actor)
      return
    }

    if (latest.eventType === 'TURN_CHANGE' || latest.eventType === 'ROUND_END' || latest.eventType === 'GAME_END') {
      setBellActor(undefined)
      setFullAnswer('')
    }
  }, [feed])

  useEffect(() => {
    setBellActor(undefined)
    setFullAnswer('')
  }, [currentTurnPlayerId])

  const wheelResultLabel = useMemo(() => {
    if (wheelResult === null) {
      return '--'
    }
    if (wheelResult === -1) {
      return 'PHÁ SẢN'
    }
    if (wheelResult === 0) {
      return 'MẤT LƯỢT'
    }
    return `${wheelResult} điểm`
  }, [wheelResult])

  const onSpinWheel = () => {
    if (!canPlay) {
      return
    }

    socketClient.publish(roomCode, {
      eventType: 'GUESS_LETTER',
      actor: nickname,
      payload: 'SPIN',
    })
  }

  const onGuessLetter = (letter: string) => {
    if (!canPlay) {
      return
    }

    socketClient.publish(roomCode, {
      eventType: 'GUESS_LETTER',
      actor: nickname,
      payload: letter,
    })
  }

  const onRingBell = () => {
    if (!canPlay || bellActor === nickname) {
      return
    }

    socketClient.publish(roomCode, {
      eventType: 'RING_BELL',
      actor: nickname,
      payload: 'request-full-answer',
    })
  }

  const onSubmitFullAnswer = (event: FormEvent) => {
    event.preventDefault()
    if (!canPlay || bellActor !== nickname || !fullAnswer.trim()) {
      return
    }

    socketClient.publish(roomCode, {
      eventType: 'GUESS_ANSWER',
      actor: nickname,
      payload: fullAnswer.trim(),
    })
    setFullAnswer('')
    setBellActor(undefined)
  }

  const isBellOwner = bellActor === nickname

  return (
    <AppShell
      title={`Phòng chơi ${roomCode}`}
      subtitle="Lối chơi theo lượt thời gian thực qua sự kiện STOMP."
      roomCode={roomCode}
      phase="Đang chơi"
      role={isObserver ? 'Quản trị quan sát' : isMyTurn ? 'Đến lượt bạn' : 'Đang chờ lượt'}
      connected={isConnected}
    >
      <div className={`grid gap-6 ${isObserver ? 'md:grid-cols-[1fr_340px]' : ''}`}>
        <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
          {isObserver ? (
            <p className="rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-200">
              Quản trị ở chế độ quan sát: bạn có thể theo dõi trận đấu nhưng không tham gia lượt chơi.
            </p>
          ) : null}

          <div className="grid gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
            <p>
              Gợi ý: <span className="font-semibold">{room?.clue ?? 'Đang chờ câu hỏi...'}</span>
            </p>
            <p>
              Đáp án: <span className="font-mono text-base tracking-[0.2em]">{room?.maskedAnswer ?? '--'}</span>
            </p>
          </div>

          <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <p>Lượt hiện tại: {turnPlayerName ?? 'Đang chờ hệ thống phân lượt...'}</p>
            <p className="mt-1">
              Thời gian còn lại: <span className="font-bold">{remainingSeconds} giây</span> / {TURN_TIMEOUT_SECONDS} giây
            </p>
          </div>

          <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-3">
            <p className="mb-2 text-sm font-semibold text-fuchsia-100">Vòng quay may mắn (hiển thị cho tất cả)</p>
            <div className="relative mx-auto h-44 w-44">
              <div className="absolute left-1/2 top-[-10px] z-20 h-0 w-0 -translate-x-1/2 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-amber-300" />
              <div
                className="h-full w-full rounded-full border-4 border-slate-200/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: wheelSpinning ? 'transform 2.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                  background:
                    'conic-gradient(#22d3ee 0deg 36deg, #f472b6 36deg 72deg, #f59e0b 72deg 108deg, #34d399 108deg 144deg, #60a5fa 144deg 180deg, #a78bfa 180deg 216deg, #f97316 216deg 252deg, #eab308 252deg 288deg, #fb7185 288deg 324deg, #94a3b8 324deg 360deg)',
                }}
              />
              <button
                type="button"
                onClick={onSpinWheel}
                disabled={!canPlay}
                className="absolute inset-[32%] grid place-items-center rounded-full bg-slate-950/85 text-xs font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Quay vòng"
              >
                SPIN
              </button>
            </div>
            <p className="mt-2 text-center text-sm text-slate-200">
              Kết quả gần nhất: <span className="font-bold text-amber-200">{wheelResultLabel}</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Bảng chữ cái (24 chữ)</p>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
              {GAME_ALPHABET.split('').map((letter) => {
                const used = usedLetters.has(letter)
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => onGuessLetter(letter)}
                    disabled={used || !canPlay}
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200 disabled:opacity-40"
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200">
            Đoán toàn bộ sai sẽ bị đặt lại về 0 điểm.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onRingBell}
              disabled={!canPlay || isBellOwner}
              className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 font-semibold text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🔔 Nhấn chuông đoán đáp án
            </button>
            <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm text-slate-200">
              {bellActor ? (
                <span>
                  <span className="font-semibold text-amber-200">{bellActor}</span> đang nhấn chuông đoán toàn bộ đáp án.
                </span>
              ) : (
                'Chưa có ai nhấn chuông.'
              )}
            </div>
          </div>

          {room ? <PlayerList players={room.players} currentTurnPlayerId={currentTurnPlayerId} /> : null}

          {!isObserver && isBellOwner ? (
            <form className="grid gap-3" onSubmit={onSubmitFullAnswer}>
              <input
                value={fullAnswer}
                onChange={(e) => setFullAnswer(e.target.value)}
                disabled={!canPlay}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Nhập dự đoán toàn bộ đáp án"
              />
              <button
                className="rounded-lg bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2 font-semibold hover:from-brand-500 hover:to-indigo-400 disabled:opacity-50"
                type="submit"
                disabled={!fullAnswer.trim() || !canPlay}
              >
                Đoán toàn bộ đáp án
              </button>
            </form>
          ) : null}
        </section>

        {isObserver ? <EventFeed items={feed} /> : null}
      </div>
    </AppShell>
  )
}

