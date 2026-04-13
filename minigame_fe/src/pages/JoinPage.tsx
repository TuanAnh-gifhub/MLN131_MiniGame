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
    <AppShell title="Join Game" subtitle="Nhap ten va ma phong de vao tro choi.">
      <section className="mx-auto w-full max-w-xl">
        <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-6">
          <p className="text-sm text-slate-400">
            Admin tao phong tai <Link to="/admin" className="text-brand-300 underline">/admin</Link>
          </p>
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Nickname</span>
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none transition focus:border-brand-500"
              placeholder="e.g. Captain_01"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Room Code</span>
            <input
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 uppercase outline-none transition focus:border-brand-500"
              placeholder="ABCD12"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              maxLength={12}
            />
          </label>

          {error ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="rounded-lg bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2.5 font-bold text-white transition hover:from-brand-500 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Join Room'}
          </button>
        </form>
      </section>
    </AppShell>
  )
}
