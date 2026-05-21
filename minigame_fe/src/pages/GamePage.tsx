import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PlayerList } from '../components/PlayerList'
import { useRealtimeRoom } from '../hooks/useRealtimeRoom'
import { useRoomPolling } from '../hooks/useRoomPolling'
import { socketClient } from '../services/socketClient'
import { useGameStore } from '../store/useGameStore'
import { useRoomStore } from '../store/useRoomStore'
import { useSessionStore } from '../store/useSessionStore'
const GAME_ALPHABET = 'ABCDEFGHIKLMNOPQRSTUVXY'
const TURN_TIMEOUT_SECONDS = 60
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

interface CompletedRoundInfo {
  roundNumber: number
  totalRounds: number
  clue: string
  answer: string
  winnerNickname: string
}

  const [fullAnswer, setFullAnswer] = useState('')
  const [completedRound, setCompletedRound] = useState<CompletedRoundInfo | null>(null)
  const completedRoundTimerRef = useRef<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(TURN_TIMEOUT_SECONDS)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wheelSpinning, setWheelSpinning] = useState(false)
  const [wheelResult, setWheelResult] = useState<number | null>(null)
  const [showWheelPopup, setShowWheelPopup] = useState(false)
  const [liveNotice, setLiveNotice] = useState<LiveNotice>()
  const spinTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const openTimerRef = useRef<number | null>(null)
  const noticeTimerRef = useRef<number | null>(null)

  useRealtimeRoom(roomCode)
  useRoomPolling(roomCode, true)

  useEffect(() => {
    if (room?.status === 'FINISHED' && completedRound === null) {
      navigate(`/room/${roomCode}/result`)
    }
  }, [navigate, room?.status, roomCode, completedRound])

  useEffect(() => {
    const latest = feed[0]
    if (latest?.eventType === 'GAME_END' && completedRound === null) {
      navigate(`/room/${roomCode}/result`)
    }
  }, [feed, navigate, roomCode, completedRound])

  const activeTurnPlayerId = room?.currentTurnPlayerId ?? currentTurnPlayerId
  const activeBellPlayerId = room?.activeBellPlayerId
  const bellUsedPlayerIds = room?.bellUsedPlayerIds ?? []
  const isMyTurn = activeTurnPlayerId && playerId ? activeTurnPlayerId === playerId : false
  const isObserver = isHost && !playerId
  const canPlay = Boolean(playerId) && Boolean(isConnected) && isMyTurn
  const bellUsedByMe = Boolean(playerId && bellUsedPlayerIds.includes(playerId))
  const canRingBell = Boolean(playerId) && Boolean(isConnected) && !wheelSpinning && !activeBellPlayerId && !bellUsedByMe
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
    return (room?.maskedAnswer ?? '').split('')
  }, [room?.maskedAnswer])

  const activeBellPlayerName = useMemo(() => {
    if (!activeBellPlayerId || !room?.players?.length) {
      return undefined
    }
    return room.players.find((player) => player.id === activeBellPlayerId)?.nickname
  }, [activeBellPlayerId, room?.players])

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
    const segmentCenterAngle = outcomeIndex * segmentAngle + segmentAngle / 2
    // Pointer is at 12 o'clock, which is 0deg in CSS conic-gradient angle space.
    const pointerAngle = 0
    const alignToPointer = ((pointerAngle - segmentCenterAngle) % 360 + 360) % 360
    setWheelSpinning(true)
    setWheelRotation((prev) => {
      const currentMod = ((prev % 360) + 360) % 360
      const deltaToTarget = ((alignToPointer - currentMod) % 360 + 360) % 360
      return prev + 1080 + deltaToTarget
    })

    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current)
    }

    spinTimerRef.current = window.setTimeout(() => {
      setWheelSpinning(false)
      setWheelResult(spinScore)

      // Auto close the popup after 2 seconds to let players see the result
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
      closeTimerRef.current = window.setTimeout(() => {
        const latestRoom = useRoomStore.getState().room
        if (latestRoom?.spinRequired) {
          setWheelResult(null)
        } else {
          setShowWheelPopup(false)
        }
        closeTimerRef.current = null
      }, 2000)
    }, 2600)
  }, [feed])

  // Open the wheel popup when spin is required on a new turn
  useEffect(() => {
    if (room?.spinRequired && activeTurnPlayerId) {
      // If a completed round board is active, wait until it finishes
      if (completedRound !== null) {
        return
      }

      // If a spin is already in progress or displaying its result,
      // let it finish and transition naturally.
      if (wheelSpinning || closeTimerRef.current !== null) {
        return
      }

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current)
        openTimerRef.current = null
      }

      const latestEvents = useGameStore.getState().feed.slice(0, 3)
      const hasNotice = latestEvents.some((event) => {
        const reason = event.payload?.reason
        return (
          event.eventType === 'RING_BELL' ||
          event.eventType === 'ROUND_END' ||
          (event.eventType === 'GAME_UPDATE' &&
            (reason === 'CORRECT_LETTER' ||
              reason === 'WRONG_LETTER' ||
              reason === 'WRONG_ANSWER_RESET_SCORE' ||
              reason === 'BANKRUPT' ||
              reason === 'LOSE_TURN'))
        )
      })

      const openPopup = () => {
        setShowWheelPopup(true)
        setWheelResult(null)
        openTimerRef.current = null
      }

      if (hasNotice) {
        // Delay opening the popup by 2.6 seconds so player can see the notification overlay
        openTimerRef.current = window.setTimeout(openPopup, 2600)
      } else {
        openPopup()
      }
    }
  }, [room?.spinRequired, activeTurnPlayerId, wheelSpinning, completedRound])

  useEffect(() => {
    return () => {
      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current)
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current)
      }
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current)
      }
      if (completedRoundTimerRef.current !== null) {
        window.clearTimeout(completedRoundTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!playerId || activeBellPlayerId === playerId) {
      return
    }
    setFullAnswer('')
  }, [activeBellPlayerId, playerId])

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

      // Capture and show completed round board
      const answer = latest.payload?.answer ?? ''
      const roundNumber = latest.payload?.currentRound ?? room?.currentRound ?? 1
      const totalRounds = latest.payload?.totalRounds ?? room?.totalRounds ?? 1
      const clue = room?.clue ?? ''

      setCompletedRound({
        roundNumber,
        totalRounds,
        clue,
        answer,
        winnerNickname: winnerNickname ?? actorLabel,
      })

      if (completedRoundTimerRef.current !== null) {
        window.clearTimeout(completedRoundTimerRef.current)
      }
      completedRoundTimerRef.current = window.setTimeout(() => {
        setCompletedRound(null)
        completedRoundTimerRef.current = null
      }, 8000)
    } else if (latest.eventType === 'GAME_UPDATE' && reason === 'BANKRUPT') {
      nextNotice = {
        text: `💥 ${actorLabel} quay vào ô Phá sản và bị mất hết điểm!`,
        tone: 'warn',
      }
    } else if (latest.eventType === 'GAME_UPDATE' && reason === 'LOSE_TURN') {
      nextNotice = {
        text: `💨 ${actorLabel} quay vào ô Mất lượt!`,
        tone: 'warn',
      }
    }

    if (!nextNotice) {
      return
    }

    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current)
    }

    const isBankruptOrLoseTurn = reason === 'BANKRUPT' || reason === 'LOSE_TURN'

    if (isBankruptOrLoseTurn) {
      // Delay showing the notice until the spin animation completes (2.6 seconds)
      noticeTimerRef.current = window.setTimeout(() => {
        setLiveNotice(nextNotice)
        noticeTimerRef.current = window.setTimeout(() => {
          setLiveNotice(undefined)
          noticeTimerRef.current = null
        }, 2600)
      }, 2600)
    } else {
      setLiveNotice(nextNotice)
      noticeTimerRef.current = window.setTimeout(() => {
        setLiveNotice(undefined)
        noticeTimerRef.current = null
      }, 2600)
    }
  }, [feed])

  useEffect(() => {
    setFullAnswer('')
  }, [room?.currentRound])

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

  const timerColorClass = useMemo(() => {
    if (remainingSeconds > 30) return 'text-emerald-400 font-bold'
    if (remainingSeconds > 10) return 'text-yellow-400 font-bold'
    return 'text-red-500 font-bold animate-pulse'
  }, [remainingSeconds])

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
    if (!canRingBell) {
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
    if (!playerId || !isConnected || activeBellPlayerId !== playerId || !fullAnswer.trim()) {
      return
    }

    socketClient.publish(roomCode, {
      eventType: 'GUESS_ANSWER',
      actor: nickname,
      payload: fullAnswer.trim(),
    })
    setFullAnswer('')
  }

  const isBellOwner = Boolean(playerId && activeBellPlayerId === playerId)

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
          <p className="rounded-lg border border-yellow-400/40 bg-yellow-500/15 px-3 py-2 text-sm text-yellow-100">
            Bạn đang tham gia với tên: <span className="font-semibold">{displayName}</span>
          </p>
        ) : null
      }
    >
      {liveNotice ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-red-950/40 backdrop-blur-sm px-4">
          <div
            className={`rounded-2xl border-2 px-8 py-6 text-center text-xl font-extrabold shadow-2xl animate-in zoom-in duration-300 max-w-md w-full ${
              liveNotice.tone === 'ok'
                ? 'border-yellow-400/80 bg-yellow-950/95 text-yellow-100 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
                : liveNotice.tone === 'warn'
                  ? 'border-red-500/80 bg-red-950/95 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                  : 'border-amber-400/80 bg-amber-950/95 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
            }`}
          >
            {liveNotice.text}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6">
        <section className="space-y-4 rounded-2xl border border-yellow-500/30 bg-red-900/70 p-4">
          {isObserver ? (
            <p className="rounded-lg border border-yellow-500/20 bg-red-900/60 p-3 text-sm text-yellow-100">
              Quản trị ở chế độ quan sát: bạn có thể theo dõi trận đấu nhưng không tham gia lượt chơi.
            </p>
          ) : null}

          <div className="grid gap-3 rounded-2xl border border-yellow-400/40 bg-red-900/60 p-5 text-center text-yellow-100 shadow-[0_0_20px_rgba(251,191,36,0.22)]">
            <p className="title-lg text-xl font-extrabold tracking-wide">{questionLabel}</p>
            <p className="text-lg">
              Câu hỏi: <span className="font-semibold">{room?.clue ?? 'Đang chờ câu hỏi...'}</span>
            </p>
            <div className="space-y-2">
              <p className="title-md text-xl font-bold">Đáp án:</p>
              <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
                {answerSlots.length > 0 ? (
                  answerSlots.map((char, index) => (
                    <span
                      key={`${char}-${index}`}
                      className={`grid h-9 w-8 place-items-center rounded-md border text-sm font-extrabold uppercase ${
                        char === ' '
                          ? 'border-transparent bg-transparent'
                          : 'border-yellow-200/60 bg-red-900/70 text-yellow-100'
                      }`}
                    >
                      {char === ' ' ? '' : char}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-yellow-200/80">--</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Left side: Turn current & Time remaining */}
            <div className="flex flex-col justify-center rounded-xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              <p className="text-base font-semibold">
                Lượt hiện tại: <span className="text-yellow-300 font-extrabold">{turnPlayerName ?? 'Đang chờ hệ thống phân lượt...'}</span>
              </p>
              <p className="mt-2 text-base">
                Thời gian còn lại: <span className={timerColorClass}>{remainingSeconds} giây</span> / {TURN_TIMEOUT_SECONDS} giây
              </p>
            </div>

            {/* Right side: Player List card */}
            <div className="rounded-xl border border-yellow-500/20 bg-red-950/40 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-300/80">Thành viên phòng chơi</p>
              {room ? <PlayerList players={room.players} currentTurnPlayerId={activeTurnPlayerId} /> : null}
            </div>
          </div>



          <div className="rounded-xl border border-yellow-500/25 bg-red-900/60 p-3">
            <p className="mb-2 text-sm font-semibold title-md">Bảng chữ cái (24 chữ)</p>
            <div className="grid grid-cols-8 gap-2 sm:grid-cols-12">
              {GAME_ALPHABET.split('').map((letter) => {
                const used = usedLetters.has(letter)
                const tileClass = used
                  ? 'border-red-900/80 bg-red-900/70 text-yellow-200/60'
                  : canPlay
                    ? 'border-yellow-400/40 bg-yellow-500/10 text-yellow-100 hover:bg-yellow-500/20'
                    : 'border-yellow-400/25 bg-yellow-500/5 text-yellow-100'
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => onGuessLetter(letter)}
                    disabled={used}
                    className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${tileClass} ${
                      canPlay ? '' : 'cursor-default'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg border border-yellow-500/25 bg-red-900/60 px-4 py-2 text-sm text-yellow-100">
            Đoán toàn bộ sai sẽ bị đặt lại về 0 điểm.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onRingBell}
              disabled={!canRingBell}
              className="rounded-lg border border-yellow-400/50 bg-yellow-500/15 px-4 py-2 font-semibold text-yellow-100 hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🔔 Nhấn chuông đoán đáp án
            </button>
            <div className="rounded-lg border border-yellow-500/25 bg-red-900/60 px-4 py-2 text-sm text-yellow-100">
              {activeBellPlayerName ? (
                <span>
                  <span className="font-semibold text-yellow-200">{activeBellPlayerName}</span> đang nhấn chuông đoán toàn bộ đáp án.
                </span>
              ) : bellUsedByMe ? (
                'Bạn đã dùng quyền nhấn chuông ở câu này. Chờ sang câu tiếp theo.'
              ) : (
                'Chưa có ai nhấn chuông.'
              )}
            </div>
          </div>



        </section>

      </div>

      {!isObserver && isBellOwner ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-red-900/70 px-4">
          <form onSubmit={onSubmitFullAnswer} className="w-full max-w-lg space-y-3 rounded-2xl border-2 border-yellow-500/40 bg-red-900/90 p-6 shadow-[0_0_25px_rgba(234,179,8,0.2)]">
            <h3 className="text-lg font-bold text-white">🔔 Nhập dự đoán toàn bộ đáp án</h3>
            <p className="text-sm text-yellow-200/70">Bạn đã nhấn chuông, hãy nhập đáp án để trả lời.</p>
            <input
              value={fullAnswer}
              onChange={(e) => setFullAnswer(e.target.value)}
              disabled={!playerId || !isConnected}
              className="w-full rounded-lg border-2 border-red-800 bg-red-950 px-4 py-3 font-semibold text-white outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50"
              placeholder="Nhập dự đoán toàn bộ đáp án"
              autoFocus
            />
            <button
              className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-yellow-400 px-4 py-3 text-lg font-black uppercase tracking-widest text-red-950 shadow-lg transition-all hover:scale-[1.02] hover:from-yellow-400 hover:to-yellow-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              type="submit"
              disabled={!fullAnswer.trim() || !playerId || !isConnected}
            >
              Xác nhận đoán đáp án
            </button>
          </form>
        </div>
      ) : null}

      {showWheelPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/80 backdrop-blur-md px-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-red-900/95 to-red-950/98 p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] space-y-6 relative overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-yellow-300 tracking-wide uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
                 VÒNG QUAY MAY MẮN
              </h3>
              <p className="text-sm text-yellow-100/90 font-medium">
                {isMyTurn ? (
                  <span className="animate-pulse text-yellow-200">
                     Đến lượt bạn quay! Nhấn nút <strong className="font-bold">SPIN</strong> để quay.
                  </span>
                ) : (
                  <span>
                    Lượt của <strong className="text-yellow-200 font-bold">{turnPlayerName ?? 'đối thủ'}</strong>. Đang chờ người chơi quay...
                  </span>
                )}
              </p>
            </div>

            {/* Lucky Wheel Canvas */}
            <div className="relative mx-auto h-56 w-56 my-4 select-none">
              <div className="absolute left-1/2 top-[-12px] z-20 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              <div
                className="h-full w-full rounded-full border-4 border-yellow-300/80 shadow-[0_0_25px_rgba(251,191,36,0.4)]"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: wheelSpinning ? 'transform 2.6s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                  background:
                    'conic-gradient(#facc15 0deg 36deg, #f59e0b 36deg 72deg, #f97316 72deg 108deg, #ef4444 108deg 144deg, #b91c1c 144deg 180deg, #fbbf24 180deg 216deg, #fde047 216deg 252deg, #ea580c 252deg 288deg, #7f1d1d 288deg 324deg, #991b1b 324deg 360deg)',
                }}
              >
                {SPIN_OUTCOMES.map((outcome, index) => {
                  const segmentAngle = 360 / SPIN_OUTCOMES.length
                  const angle = index * segmentAngle + segmentAngle / 2
                  const isSelected = selectedOutcomeIndex === index
                  return (
                    <span
                      key={`${outcome}-${index}`}
                      className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-xs font-black drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] ${
                        isSelected ? 'text-yellow-200 scale-110 font-bold' : 'text-white'
                      }`}
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-82px) rotate(${-angle}deg)`,
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
                disabled={!canPlay || wheelSpinning || wheelResult !== null}
                className="absolute inset-[32%] grid place-items-center rounded-full bg-gradient-to-br from-red-950 to-red-900 border-2 border-yellow-300 text-sm font-extrabold text-yellow-300 shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 z-30"
                aria-label="Quay vòng"
              >
                SPIN
              </button>
            </div>

            {/* Spin outcome display */}
            <div className="min-h-[70px] flex flex-col items-center justify-center">
              {wheelSpinning ? (
                <p className="text-sm font-semibold text-yellow-100 animate-pulse flex items-center gap-1.5 justify-center">
                   Đang quay vòng xoay may mắn...
                </p>
              ) : wheelResult !== null ? (
                <div className="p-3 bg-yellow-500/15 border border-yellow-400/30 rounded-2xl w-full max-w-[280px] mx-auto animate-in zoom-in-95 duration-200">
                  <p className="text-xs text-yellow-200/80 font-bold uppercase tracking-wider">Kết quả quay được</p>
                  <p className="text-xl font-black text-yellow-300 tracking-wide mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    {wheelResultLabel}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-yellow-200/60 italic font-medium animate-pulse">
                  {isMyTurn ? 'Nhấn SPIN để xác định điểm số của bạn!' : 'Đang đợi kết quả quay...'}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {completedRound ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/85 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-red-900/95 to-red-950/98 p-8 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)] space-y-6 relative overflow-hidden animate-in zoom-in duration-300">
            {/* Decorative top icon */}
            <div className="mx-auto h-16 w-16 rounded-full bg-yellow-500/10 border border-yellow-400/30 flex items-center justify-center text-3xl animate-bounce">
              🎉
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-yellow-300 tracking-wider uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
                VÒNG CHƠI HOÀN THÀNH
              </h3>
              <p className="text-sm text-yellow-100/80 font-bold uppercase tracking-widest">
                Câu số {completedRound.roundNumber}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-red-950/60 p-6 space-y-4 shadow-inner">
              <div className="space-y-1">
                <p className="text-xs text-yellow-200/60 font-bold uppercase tracking-wider">Đề bài / Câu hỏi</p>
                <p className="text-lg font-bold text-white leading-relaxed">
                  "{completedRound.clue}"
                </p>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />

              <div className="space-y-2">
                <p className="text-xs text-yellow-200/60 font-bold uppercase tracking-wider">Đáp án chính xác</p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {completedRound.answer.split('').map((char, index) => (
                    <span
                      key={`${char}-${index}`}
                      className={`grid h-10 w-9 place-items-center rounded-lg border text-base font-black uppercase shadow-sm ${
                        char === ' '
                          ? 'border-transparent bg-transparent'
                          : 'border-yellow-400 bg-yellow-500/10 text-yellow-300 font-extrabold'
                      }`}
                    >
                      {char === ' ' ? '' : char}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-2xl">
              <p className="text-sm font-medium text-yellow-100">
                Chúc mừng <span className="font-extrabold text-yellow-300 text-base">{completedRound.winnerNickname}</span> đã xuất sắc chốt đáp án chính xác!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-yellow-200/60 font-bold tracking-wider animate-pulse">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              {completedRound.roundNumber >= completedRound.totalRounds
                ? 'ĐANG TỔNG HỢP ĐIỂM SỐ & BẢNG XẾP HẠNG CUỐI CÙNG...'
                : 'ĐANG CHUYỂN SANG CÂU HỎI TIẾP THEO...'}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
