import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
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

interface LiveNotice {
  text: string
  tone: 'ok' | 'warn' | 'info'
}

function formatSpinOutcome(value: number): string {
  if (value === -1) return 'Phá sản'
  if (value === 0) return 'Mất lượt'
  return String(value)
}

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
  const [pendingWheelResult, setPendingWheelResult] = useState<number | null>(null)
  const [lastSpinEventKey, setLastSpinEventKey] = useState('')
  const [bellActor, setBellActor] = useState<string>()
  const [liveNotice, setLiveNotice] = useState<LiveNotice>()
  const spinResultTimerRef = useRef<number | null>(null)

  useRealtimeRoom(roomCode)
  useRoomPolling(roomCode, true)

  useEffect(() => {
    if (room?.status === 'FINISHED') {
      navigate(`/room/${roomCode}/result`)
    }
  }, [navigate, room?.status, roomCode])

  useEffect(() => {
    const latest = feed[0]
    if (latest?.eventType === 'GAME_END') {
      navigate(`/room/${roomCode}/result`)
    }
  }, [feed, navigate, roomCode])

  const activeTurnPlayerId = room?.currentTurnPlayerId ?? currentTurnPlayerId
  const isMyTurn = activeTurnPlayerId && playerId ? activeTurnPlayerId === playerId : false
  const isObserver = isHost && !playerId
  const canPlay = Boolean(playerId) && Boolean(isConnected) && isMyTurn
  const displayName = nickname.trim() || room?.players.find((player) => player.id === playerId)?.nickname || 'Chưa xác định'

  const usedLetters = useMemo(
    () => new Set((room?.usedLetters ?? '').split(',').map((item) => item.trim()).filter(Boolean)),
    [room?.usedLetters],
  )

  const turnPlayerName = useMemo(() => {
    if (!room?.players?.length || !activeTurnPlayerId) {
      return undefined
    }
    return room.players.find((player) => player.id === activeTurnPlayerId)?.nickname
  }, [activeTurnPlayerId, room?.players])

  const questionLabel = useMemo(() => {
    if (!room?.currentRound) {
      return 'Đang chờ câu hỏi...'
    }
    if (room.totalRounds && room.totalRounds > 0) {
      return `Câu ${room.currentRound}/${room.totalRounds}`
    }
    return `Câu ${room.currentRound}`
  }, [room?.currentRound, room?.totalRounds])

  const answerSlots = useMemo(() => {
    const masked = room?.maskedAnswer ?? ''
    return masked.split('')
  }, [room?.maskedAnswer])

  useEffect(() => {
    if (!room?.lastTurnAt || !activeTurnPlayerId) {
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
  }, [activeTurnPlayerId, room?.lastTurnAt])

  useEffect(() => {
    const latestSpinUpdate = feed.find(
      (item) => item.eventType === 'GAME_UPDATE' && typeof item.payload?.spinScore === 'number',
    )

    if (!latestSpinUpdate) {
      return
    }

    const spinScore = latestSpinUpdate.payload?.spinScore
    if (typeof spinScore !== 'number') {
      return
    }

    const spinEventKey = `${latestSpinUpdate.serverTime}-${spinScore}`
    if (spinEventKey === lastSpinEventKey) {
      return
    }

    const outcomeIndex = SPIN_OUTCOMES.indexOf(spinScore)
    if (outcomeIndex < 0) {
      return
    }

    const segmentAngle = 360 / SPIN_OUTCOMES.length
    const segmentCenterAngle = outcomeIndex * segmentAngle + segmentAngle / 2
    // Pointer is at 12 o'clock, which is 0deg in CSS conic-gradient angle space.
    const pointerAngle = 0
    const alignToPointer = ((pointerAngle - segmentCenterAngle) % 360 + 360) % 360
    setLastSpinEventKey(spinEventKey)
    setPendingWheelResult(spinScore)
    setWheelSpinning(true)
    setWheelRotation((prev) => {
      const currentMod = ((prev % 360) + 360) % 360
      const deltaToTarget = ((alignToPointer - currentMod) % 360 + 360) % 360
      return prev + 1080 + deltaToTarget
    })

    if (spinResultTimerRef.current !== null) {
      window.clearTimeout(spinResultTimerRef.current)
    }
    spinResultTimerRef.current = window.setTimeout(() => {
      setWheelSpinning(false)
      setWheelResult(spinScore)
      setPendingWheelResult(null)
      spinResultTimerRef.current = null
    }, 2600)
  }, [feed, lastSpinEventKey])

  useEffect(() => {
    return () => {
      if (spinResultTimerRef.current !== null) {
        window.clearTimeout(spinResultTimerRef.current)
      }
    }
  }, [])

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
    const latest = feed[0]
    if (!latest) {
      return
    }

    const reason = typeof latest.payload?.reason === 'string' ? latest.payload.reason : undefined
    const payloadActor = typeof latest.payload?.actorNickname === 'string' ? latest.payload.actorNickname : undefined
    const winnerNickname = typeof latest.payload?.winnerNickname === 'string' ? latest.payload.winnerNickname : undefined
    const actorLabel = payloadActor ?? latest.actor
    let nextNotice: LiveNotice | undefined

    if (latest.eventType === 'RING_BELL') {
      nextNotice = {
        text: `🔔 ${latest.actor} vừa nhấn chuông đoán đáp án`,
        tone: 'info',
      }
    } else if (latest.eventType === 'GAME_UPDATE' && reason === 'CORRECT_LETTER') {
      nextNotice = {
        text: `✅ ${actorLabel} đoán đúng chữ cái`,
        tone: 'ok',
      }
    } else if (latest.eventType === 'GAME_UPDATE' && reason === 'WRONG_LETTER') {
      nextNotice = {
        text: `❌ ${actorLabel} đoán sai chữ cái`,
        tone: 'warn',
      }
    } else if (latest.eventType === 'GAME_UPDATE' && reason === 'WRONG_ANSWER_RESET_SCORE') {
      nextNotice = {
        text: `❌ ${actorLabel} đoán đáp án sai và bị về 0 điểm`,
        tone: 'warn',
      }
    } else if (latest.eventType === 'ROUND_END') {
      nextNotice = {
        text: `🎉 ${(winnerNickname ?? actorLabel) === 'system' ? 'Có người' : winnerNickname ?? actorLabel} đã chốt đáp án đúng`,
        tone: 'ok',
      }
    }

    if (!nextNotice) {
      return
    }

    setLiveNotice(nextNotice)
    const timerId = window.setTimeout(() => setLiveNotice(undefined), 2600)
    return () => window.clearTimeout(timerId)
  }, [feed])

  useEffect(() => {
    setBellActor(undefined)
    setFullAnswer('')
  }, [activeTurnPlayerId])

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

  const selectedOutcomeIndex = useMemo(() => {
    if (wheelResult === null) {
      return undefined
    }
    const index = SPIN_OUTCOMES.indexOf(wheelResult)
    return index >= 0 ? index : undefined
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
      headerRight={
        !isObserver ? (
          <p className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
            Bạn đang tham gia với tên: <span className="font-semibold">{displayName}</span>
          </p>
        ) : null
      }
    >
      {liveNotice ? (
        <div className="fixed left-1/2 top-4 z-50 w-[92%] max-w-xl -translate-x-1/2">
          <div
            className={`rounded-xl border px-4 py-3 text-center text-sm font-semibold shadow-2xl animate-pulse ${
              liveNotice.tone === 'ok'
                ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                : liveNotice.tone === 'warn'
                  ? 'border-rose-300/60 bg-rose-500/20 text-rose-100'
                  : 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100'
            }`}
          >
            {liveNotice.text}
          </div>
        </div>
      ) : null}

      <div className={`grid gap-6 ${isObserver ? 'md:grid-cols-[1fr_340px]' : ''}`}>
        <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
          {isObserver ? (
            <p className="rounded-lg border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-200">
              Quản trị ở chế độ quan sát: bạn có thể theo dõi trận đấu nhưng không tham gia lượt chơi.
            </p>
          ) : null}

          <div className="grid gap-3 rounded-2xl border border-cyan-300/40 bg-cyan-500/15 p-5 text-center text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.22)]">
            <p className="text-xl font-extrabold tracking-wide">{questionLabel}</p>
            <p className="text-lg">
              Câu hỏi: <span className="font-semibold">{room?.clue ?? 'Đang chờ câu hỏi...'}</span>
            </p>
            <div className="space-y-2">
              <p className="text-xl font-bold">Đáp án:</p>
              <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
                {answerSlots.length > 0 ? (
                  answerSlots.map((char, index) => (
                    <span
                      key={`${char}-${index}`}
                      className={`grid h-9 w-8 place-items-center rounded-md border text-sm font-extrabold uppercase ${
                        char === ' '
                          ? 'border-transparent bg-transparent'
                          : 'border-cyan-200/60 bg-slate-900/70 text-cyan-50'
                      }`}
                    >
                      {char === ' ' ? '' : char}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-cyan-100/80">--</span>
                )}
              </div>
            </div>
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
              >
                {SPIN_OUTCOMES.map((outcome, index) => {
                  const segmentAngle = 360 / SPIN_OUTCOMES.length
                  const angle = index * segmentAngle + segmentAngle / 2
                  const isSelected = selectedOutcomeIndex === index
                  return (
                    <span
                      key={`${outcome}-${index}`}
                      className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                        isSelected ? 'text-amber-200' : 'text-white'
                      }`}
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-64px) rotate(${-angle}deg)`,
                      }}
                    >
                      {formatSpinOutcome(outcome)}
                    </span>
                  )
                })}
              </div>
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
              {wheelSpinning ? 'Đang quay: ' : 'Đang trúng: '}
              <span className="font-bold text-amber-200">{wheelSpinning ? (pendingWheelResult !== null ? formatSpinOutcome(pendingWheelResult) : '--') : wheelResultLabel}</span>
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

          {room ? <PlayerList players={room.players} currentTurnPlayerId={activeTurnPlayerId} /> : null}

        </section>

        {isObserver ? <EventFeed items={feed} /> : null}
      </div>

      {!isObserver && isBellOwner ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4">
          <form onSubmit={onSubmitFullAnswer} className="w-full max-w-lg space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">🔔 Nhập dự đoán toàn bộ đáp án</h3>
            <p className="text-sm text-slate-300">Bạn đã nhấn chuông, hãy nhập đáp án để trả lời.</p>
            <input
              value={fullAnswer}
              onChange={(e) => setFullAnswer(e.target.value)}
              disabled={!canPlay}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              placeholder="Nhập dự đoán toàn bộ đáp án"
              autoFocus
            />
            <button
              className="w-full rounded-lg bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2 font-semibold hover:from-brand-500 hover:to-indigo-400 disabled:opacity-50"
              type="submit"
              disabled={!fullAnswer.trim() || !canPlay}
            >
              Xác nhận đoán đáp án
            </button>
          </form>
        </div>
      ) : null}
    </AppShell>
  )
}

