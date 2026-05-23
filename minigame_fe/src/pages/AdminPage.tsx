import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { createAdminRoom, deleteQuestionSet, getQuestionSets, saveQuestionSet } from '../services/roomService'
import { useRoomStore } from '../store/useRoomStore'
import { useSessionStore } from '../store/useSessionStore'
import type { AdminQuestionInput } from '../types/room'
import type { QuestionSetSummary } from '../types/questionSet'
import { normalizeRoomCode } from '../utils/roomCode'

const emptyQuestion: AdminQuestionInput = {
  category: 'general',
  clue: '',
  answer: '',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Save Modal ───────────────────────────────────────────────────────────────

interface SaveModalProps {
  onSave: (name: string) => Promise<void>
  onClose: () => void
}

function SaveModal({ onSave, onClose }: SaveModalProps) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setErr(undefined)
    try {
      await onSave(name.trim())
      onClose()
    } catch (caught) {
      setErr(caught instanceof Error ? caught.message : 'Không thể lưu bộ câu hỏi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-b from-red-800/95 via-red-900/98 to-red-950 p-7 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
        <h2 className="mb-5 text-lg font-black uppercase tracking-widest text-yellow-300">
          💾 Lưu bộ câu hỏi
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-yellow-200/80">Tên bộ câu hỏi</span>
            <input
              ref={inputRef}
              className="rounded-lg border-2 border-red-700 bg-red-950 px-4 py-2.5 font-semibold text-white outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50"
              placeholder="VD: Câu hỏi MLN131 tuần 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </label>
          {err && (
            <p className="rounded-lg border border-orange-500/40 bg-orange-500/15 px-3 py-2 text-sm font-bold text-orange-200">
              {err}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 border border-yellow-400 py-2.5 font-black uppercase tracking-wider text-red-950 shadow transition-all hover:from-yellow-400 hover:to-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-red-600/50 bg-red-900/50 px-4 py-2.5 font-bold text-red-200 transition hover:bg-red-800/60"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Saved Sets Panel ─────────────────────────────────────────────────────────

interface SavedSetsPanelProps {
  sets: QuestionSetSummary[]
  loading: boolean
  onLoad: (id: string) => void
  onDelete: (id: string, name: string) => void
}

function SavedSetsPanel({ sets, loading, onLoad, onDelete }: SavedSetsPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-b from-red-800/60 to-red-900/70 shadow-[0_0_20px_rgba(234,179,8,0.12)]">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-t-2xl px-5 py-4 text-left transition hover:bg-yellow-500/5"
      >
        <div className="flex items-center gap-3">
          
          <span className="font-black uppercase tracking-widest text-yellow-300">
            Bộ câu hỏi đã lưu
          </span>
          {sets.length > 0 && (
            <span className="rounded-full bg-yellow-500/20 border border-yellow-400/30 px-2 py-0.5 text-xs font-bold text-yellow-300">
              {sets.length}
            </span>
          )}
        </div>
        <span
          className={`text-yellow-400/60 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-yellow-500/20 px-5 pb-5 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-red-300/70">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-yellow-500/40 border-t-yellow-400" />
              Đang tải...
            </div>
          ) : sets.length === 0 ? (
            <p className="py-4 text-center text-sm text-red-300/60 italic">
              Chưa có bộ câu hỏi nào được lưu.
            </p>
          ) : (
            <div className="grid gap-2">
              {sets.map((set) => (
                <div
                  key={set.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-yellow-500/20 bg-red-950/50 px-4 py-3 transition hover:border-yellow-400/40 hover:bg-red-900/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{set.name}</p>
                    <p className="mt-0.5 text-xs text-red-300/70">
                      {set.questionCount} câu hỏi &bull; {formatDate(set.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => onLoad(set.id)}
                      className="rounded-lg border border-yellow-500/40 bg-yellow-500/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-yellow-300 transition hover:bg-yellow-500/30"
                    >
                      Dùng bộ này
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(set.id, set.name)}
                      className="rounded-lg border border-red-500/30 bg-red-600/20 px-2.5 py-1.5 text-xs font-bold text-red-300 opacity-0 transition hover:bg-red-600/40 group-hover:opacity-100"
                      title="Xóa bộ câu hỏi"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── AdminPage ────────────────────────────────────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate()
  const setSession = useSessionStore((s) => s.setSession)
  const setRoom = useRoomStore((s) => s.setRoom)

  const [hostNickname, setHostNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [questions, setQuestions] = useState<AdminQuestionInput[]>([{ ...emptyQuestion }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  // — saved sets state —
  const [sets, setSets] = useState<QuestionSetSummary[]>([])
  const [setsLoading, setSetsLoading] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [loadedSetName, setLoadedSetName] = useState<string>()

  // Fetch saved sets on mount
  useEffect(() => {
    setSetsLoading(true)
    getQuestionSets()
      .then(setSets)
      .catch(() => setSets([]))
      .finally(() => setSetsLoading(false))
  }, [])

  const canSubmit = useMemo(() => {
    if (hostNickname.trim().length < 2) return false
    return questions.every(
      (item) =>
        item.clue.trim().length >= 3 &&
        item.answer.trim().length >= 1 &&
        item.category.trim().length >= 2,
    )
  }, [hostNickname, questions])

  const updateQuestion = (index: number, next: Partial<AdminQuestionInput>) => {
    setQuestions((prev) => prev.map((item, i) => (i === index ? { ...item, ...next } : item)))
  }

  const addQuestion = () => setQuestions((prev) => [...prev, { ...emptyQuestion }])

  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  // Load a saved question set into the form
  const handleLoadSet = useCallback(
    async (id: string) => {
      const found = sets.find((s) => s.id === id)
      try {
        const { getQuestionSet } = await import('../services/roomService')
        const detail = await getQuestionSet(id)
        setQuestions(
          detail.questions.map((q) => ({
            category: q.category,
            clue: q.clue,
            answer: q.answer,
          })),
        )
        setLoadedSetName(found?.name ?? detail.name)
      } catch {
        setError('Không thể tải bộ câu hỏi')
      }
    },
    [sets],
  )

  // Save current questions as a new set
  const handleSaveSet = useCallback(
    async (name: string) => {
      const saved = await saveQuestionSet(
        name,
        questions.map((q) => ({
          category: q.category.trim(),
          clue: q.clue.trim(),
          answer: q.answer.trim().toUpperCase(),
        })),
      )
      setSets((prev) => [
        {
          id: saved.id,
          name: saved.name,
          questionCount: saved.questions.length,
          createdAt: saved.createdAt,
        },
        ...prev,
      ])
    },
    [questions],
  )

  // Delete a saved set
  const handleDeleteSet = useCallback(async (id: string, name: string) => {
    if (!confirm(`Xóa bộ câu hỏi "${name}"?`)) return
    try {
      await deleteQuestionSet(id)
      setSets((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setError('Không thể xóa bộ câu hỏi')
    }
  }, [])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setError(undefined)

    const normalizedRoomCode = roomCode.trim().toUpperCase()

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

      setSession({
        nickname: hostNickname.trim(),
        roomCode: room.code,
        token: '',
        isHost: true,
        playerId: undefined,
      })
      setRoom(room)
      navigate(`/room/${room.code}/waiting`)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Không thể tạo phòng quản trị'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell
      title="Thiết lập quản trị"
      subtitle="Tạo phòng, đặt mã phòng và nhập câu hỏi/đáp án."
      headerClassName="bg-gradient-to-r from-red-700/90 via-red-600/90 to-red-800/90 border-yellow-400/70 shadow-[0_0_32px_rgba(250,204,21,0.35)]"
    >
      {/* Save modal */}
      {showSaveModal && (
        <SaveModal onSave={handleSaveSet} onClose={() => setShowSaveModal(false)} />
      )}

      <div className="mx-auto grid w-full max-w-3xl gap-5">
        {/* Saved sets panel */}
        <SavedSetsPanel
          sets={sets}
          loading={setsLoading}
          onLoad={handleLoadSet}
          onDelete={handleDeleteSet}
        />

        {/* Main form */}
        <form
          onSubmit={onSubmit}
          className="grid gap-5 rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-b from-red-800/85 via-red-900/90 to-red-950/95 p-8 shadow-[0_0_28px_rgba(234,179,8,0.28)]"
        >
          <label className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">
              Tên quản trị / chủ phòng
            </span>
            <input
              className="rounded-lg border-2 border-red-800 bg-red-950 px-4 py-3 font-semibold text-white outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50"
              value={hostNickname}
              onChange={(e) => setHostNickname(e.target.value)}
              placeholder="admin_1"
              maxLength={30}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">
              Mã phòng (không bắt buộc)
            </span>
            <input
              className="rounded-lg border-2 border-red-800 bg-red-950 px-4 py-3 font-mono font-bold text-white uppercase outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50 tracking-widest"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="ABCD12"
            />
          </label>

          {/* Questions section header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-yellow-300">
                Danh sách câu hỏi
              </p>
              {loadedSetName && (
                <p className="mt-0.5 text-xs text-yellow-200/60">
                  Đang dùng: <span className="font-bold text-yellow-300/80">{loadedSetName}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              disabled={questions.every((q) => !q.clue.trim())}
              className="flex items-center gap-1.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-40"
              title="Lưu bộ câu hỏi hiện tại để dùng lại"
            >
               Lưu bộ câu hỏi này
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((item, index) => (
              <div
                key={index}
                className="grid gap-4 rounded-xl border border-yellow-500/30 bg-red-950/60 p-5 shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <p className="text-base font-black text-yellow-300 uppercase tracking-widest">
                    Câu hỏi #{index + 1}
                  </p>
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
                  placeholder="Chủ đề"
                  value={item.category}
                  onChange={(e) => updateQuestion(index, { category: e.target.value })}
                  maxLength={100}
                />
                <input
                  className="rounded-lg border-2 border-red-800 bg-red-900 px-4 py-2 text-sm text-white placeholder-red-300 focus:border-yellow-500 outline-none transition"
                  placeholder="Gợi ý"
                  value={item.clue}
                  onChange={(e) => updateQuestion(index, { clue: e.target.value })}
                  maxLength={300}
                />
                <input
                  className="rounded-lg border-2 border-red-800 bg-red-900 px-4 py-2 text-sm font-bold uppercase text-yellow-100 placeholder-red-300 focus:border-yellow-500 outline-none transition tracking-wider"
                  placeholder="Đáp án"
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
            + Thêm câu hỏi
          </button>

          {error ? (
            <p className="rounded-lg border-2 border-orange-500/50 bg-orange-500/20 p-3 text-sm font-bold text-orange-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="mt-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-yellow-400 px-4 py-3 text-lg font-black uppercase tracking-widest text-red-950 shadow-lg transition-all hover:scale-[1.02] hover:from-yellow-400 hover:to-yellow-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Đang xử lý...' : 'Tạo phòng và tiếp tục'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
