import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useGameStore } from '../store/useGameStore'
import { useRoomStore } from '../store/useRoomStore'

export function ResultPage() {
  const room = useRoomStore((s) => s.room)
  const isConnected = useGameStore((s) => s.isConnected)

  const ranking = useMemo(() => {
    if (!room) {
      return []
    }
    return [...room.players].sort((a, b) => b.score - a.score)
  }, [room])

  return (
    <AppShell
      title="Final Result"
      subtitle="Top players for this game session."
      roomCode={room?.code}
      phase="Completed"
      connected={isConnected}
    >
      <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
        {ranking.length === 0 ? <p className="text-slate-400">No result yet.</p> : null}
        <ol className="space-y-2">
          {ranking.map((player, index) => (
            <li
              key={player.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                index === 0
                  ? 'border-amber-300/50 bg-amber-500/15 text-amber-100'
                  : 'border-slate-700 bg-slate-800 text-slate-100'
              }`}
            >
              <span>
                #{index + 1} {player.nickname}
              </span>
              <span className="font-semibold">{player.score} pts</span>
            </li>
          ))}
        </ol>

        <Link
          to="/"
          className="mt-4 inline-block rounded-lg bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2 font-semibold text-white hover:from-brand-500 hover:to-indigo-400"
        >
          Back to Join
        </Link>
      </section>
    </AppShell>
  )
}

