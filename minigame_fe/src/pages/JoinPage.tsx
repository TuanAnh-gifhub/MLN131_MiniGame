import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { requestGuestToken } from '../services/authService'
import { joinRoom } from '../services/roomService'
import { useRoomStore } from '../store/useRoomStore'
import { useSessionStore } from '../store/useSessionStore'
import { normalizeRoomCode } from '../utils/roomCode'

export function JoinPage() {
  const params = useParams<{ roomCode?: string }>()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState(params.roomCode ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const setSession = useSessionStore((s) => s.setSession)
  const setRoom = useRoomStore((s) => s.setRoom)

  const canSubmit = useMemo(() => nickname.trim().length >= 2 && roomCodeInput.trim().length >= 4, [nickname, roomCodeInput])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setError(undefined)
    setLoading(true)

    try {
      const room = await joinRoom(normalizeRoomCode(roomCodeInput), nickname.trim())
      const token = await requestGuestToken(nickname.trim(), room.code)
      const me = room.players.find((player) => player.nickname.toLowerCase() === nickname.trim().toLowerCase())

      setSession({
        nickname: nickname.trim(),
        roomCode: room.code,
        token: token.token,
        isHost: Boolean(me?.host),
        playerId: me?.id,
      })
      setRoom(room)
      navigate(`/room/${room.code}/waiting`)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Cannot join room'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="THAM GIA TRÒ CHƠI" subtitle="Nhập Tên người chơi và Mã phòng để bước vào thử thách.">
      <section className="mx-auto w-full max-w-xl">
        <form onSubmit={onSubmit} className="grid gap-5 rounded-2xl border-2 border-yellow-500/40 bg-red-900/90 p-8 shadow-[0_0_25px_rgba(234,179,8,0.2)]">
          <p className="text-sm font-medium text-yellow-200/70">
            Admin tạo phòng tại <Link to="/admin" className="text-yellow-400 font-bold underline hover:text-yellow-300">/admin</Link>
          </p>
          <label className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">Tên người chơi</span>
            <input
              className="rounded-lg border-2 border-red-800 bg-red-950 px-4 py-3 font-semibold text-white outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50"
              placeholder="VD: Dong_Chi_01"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-yellow-300">Mã phòng</span>
            <input
              className="rounded-lg border-2 border-red-800 bg-red-950 px-4 py-3 font-mono font-bold text-white uppercase outline-none transition focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 placeholder-red-400/50 tracking-widest"
              placeholder="ABCD12"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              maxLength={12}
            />
          </label>

          {error ? <p className="rounded-lg border-2 border-orange-500/50 bg-orange-500/20 p-3 text-sm font-bold text-orange-200">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="mt-2 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 border-2 border-yellow-400 px-4 py-3 text-lg font-black uppercase tracking-widest text-red-950 shadow-lg transition-all hover:scale-[1.02] hover:from-yellow-400 hover:to-yellow-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Đang xử lý...' : 'VÀO PHÒNG'}
          </button>
        </form>
      </section>
    </AppShell>
  )
}
