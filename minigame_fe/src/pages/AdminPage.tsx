import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { requestGuestToken } from '../services/authService'
import { createAdminRoom } from '../services/roomService'
import { useRoomStore } from '../store/useRoomStore'
import { useSessionStore } from '../store/useSessionStore'
import type { AdminQuestionInput } from '../types/room'
import { normalizeRoomCode } from '../utils/roomCode'

const emptyQuestion: AdminQuestionInput = {
  category: 'general',
  clue: '',
  answer: '',
}

const ROOM_CODE_PATTERN = /^[A-Z0-9]{4,12}$/

export function AdminPage() {
  const navigate = useNavigate()
  const setSession = useSessionStore((s) => s.setSession)
  const setRoom = useRoomStore((s) => s.setRoom)

  const [hostNickname, setHostNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [questions, setQuestions] = useState<AdminQuestionInput[]>([{ ...emptyQuestion }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const canSubmit = useMemo(() => {
    if (hostNickname.trim().length < 2) {
      return false
    }
    const normalizedRoomCode = roomCode.trim().toUpperCase()
    if (normalizedRoomCode && !ROOM_CODE_PATTERN.test(normalizedRoomCode)) {
      return false
    }
    return questions.every((item) => item.clue.trim().length >= 3 && item.answer.trim().length >= 1 && item.category.trim().length >= 2)
  }, [hostNickname, questions, roomCode])

  const updateQuestion = (index: number, next: Partial<AdminQuestionInput>) => {
    setQuestions((prev) => prev.map((item, i) => (i === index ? { ...item, ...next } : item)))
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion }])
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setLoading(true)
    setError(undefined)

    const normalizedRoomCode = roomCode.trim().toUpperCase()
    if (normalizedRoomCode && !ROOM_CODE_PATTERN.test(normalizedRoomCode)) {
      setError('Room code must be 4-12 characters and only use A-Z or 0-9.')
      setLoading(false)
      return
    }

    try {
      const room = await createAdminRoom({
        hostNickname: hostNickname.trim(),
        roomCode: normalizedRoomCode ? normalizeRoomCode(normalizedRoomCode) : undefined,
        questions: questions.map((item) => ({
          category: item.category.trim(),
          clue: item.clue.trim(),
          answer: item.answer.trim().toUpperCase(),
        })),
      })

      const token = await requestGuestToken(hostNickname.trim(), room.code)
      const me = room.players.find((player) => player.nickname.toLowerCase() === hostNickname.trim().toLowerCase())

      setSession({
        nickname: hostNickname.trim(),
        roomCode: room.code,
        token: token.token,
        isHost: Boolean(me?.host),
        playerId: me?.id,
      })
      setRoom(room)
      navigate(`/room/${room.code}/waiting`)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Cannot create admin room'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="TẠO PHÒNG MỚI" subtitle="Nhập tên, mã phòng và danh sách câu hỏi để bắt đầu.">
      <form onSubmit={onSubmit} className="mx-auto grid w-full max-w-3xl gap-5 rounded-2xl border-2 border-yellow-500/40 bg-red-900/90 p-8 shadow-[0_0_25px_rgba(234,179,8,0.2)]">
        <label className="grid gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">Tên Quản Trò (Admin)</span>
          <input
            className="rounded-lg border-2 border-red-800 bg-red-950 px-4 py-3 font-semibold text-white outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50"
            value={hostNickname}
            onChange={(e) => setHostNickname(e.target.value)}
            placeholder="admin_1"
            maxLength={30}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">Mã Phòng (Không bắt buộc)</span>
          <input
            className="rounded-lg border-2 border-red-800 bg-red-950 px-4 py-3 font-mono font-bold text-white uppercase outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50 tracking-widest"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="ABCD12"
            maxLength={12}
          />
        </label>

        <div className="space-y-3">
          {questions.map((item, index) => (
            <div key={index} className="grid gap-4 rounded-xl border border-yellow-500/30 bg-red-950/60 p-5 shadow-inner">
              <div className="flex items-center justify-between">
                <p className="text-base font-black text-yellow-300 uppercase tracking-widest">Câu hỏi #{index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="rounded-lg border border-red-500 bg-red-600/80 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-red-500"
                >
                  Xóa
                </button>
              </div>

              <input
                className="rounded-lg border-2 border-red-800 bg-red-900 px-4 py-2 text-sm text-white placeholder-red-300 focus:border-yellow-500 outline-none transition"
                placeholder="Chủ đề (VD: Lịch sử, Tư tưởng)"
                value={item.category}
                onChange={(e) => updateQuestion(index, { category: e.target.value })}
                maxLength={100}
              />
              <input
                className="rounded-lg border-2 border-red-800 bg-red-900 px-4 py-2 text-sm text-white placeholder-red-300 focus:border-yellow-500 outline-none transition"
                placeholder="Gợi ý câu hỏi"
                value={item.clue}
                onChange={(e) => updateQuestion(index, { clue: e.target.value })}
                maxLength={300}
              />
              <input
                className="rounded-lg border-2 border-red-800 bg-red-900 px-4 py-2 text-sm font-bold uppercase text-yellow-100 placeholder-red-300 focus:border-yellow-500 outline-none transition tracking-wider"
                placeholder="ĐÁP ÁN"
                value={item.answer}
                onChange={(e) => updateQuestion(index, { answer: e.target.value })}
                maxLength={200}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="w-fit rounded-lg border border-yellow-400/40 bg-yellow-500/20 px-4 py-2 text-sm font-bold text-yellow-200 hover:bg-yellow-500/40"
        >
          + Thêm Câu Hỏi
        </button>

        {error ? <p className="rounded-lg border-2 border-orange-500/50 bg-orange-500/20 p-3 text-sm font-bold text-orange-200">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="mt-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-yellow-400 px-4 py-3 text-lg font-black uppercase tracking-widest text-red-950 shadow-lg transition-all hover:scale-[1.02] hover:from-yellow-400 hover:to-yellow-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? 'Đang xử lý...' : 'TẠO PHÒNG & TIẾP TỤC'}
        </button>
      </form>
    </AppShell>
  )
}

