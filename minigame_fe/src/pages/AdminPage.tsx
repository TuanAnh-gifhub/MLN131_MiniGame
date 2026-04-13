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
    <AppShell title="Admin Setup" subtitle="Tao phong, set ma phong va nhap cau hoi/dap an.">
      <form onSubmit={onSubmit} className="mx-auto grid w-full max-w-3xl gap-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-6">
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Admin / Host Nickname</span>
          <input
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition focus:border-brand-500"
            value={hostNickname}
            onChange={(e) => setHostNickname(e.target.value)}
            placeholder="admin_1"
            maxLength={30}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Room Code (optional)</span>
          <input
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 uppercase outline-none transition focus:border-brand-500"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="ABCD12"
            maxLength={12}
          />
        </label>

        <div className="space-y-3">
          {questions.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-200">Question #{index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs text-red-100 hover:bg-red-500/20"
                >
                  Remove
                </button>
              </div>

              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Category"
                value={item.category}
                onChange={(e) => updateQuestion(index, { category: e.target.value })}
                maxLength={100}
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Clue"
                value={item.clue}
                onChange={(e) => updateQuestion(index, { clue: e.target.value })}
                maxLength={300}
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm uppercase"
                placeholder="Answer"
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
          className="w-fit rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20"
        >
          + Add Question
        </button>

        {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded-lg bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2.5 font-bold text-white transition hover:from-brand-500 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Create Room & Continue'}
        </button>
      </form>
    </AppShell>
  )
}

