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
      title="Kết quả chung cuộc"
      subtitle="Bảng xếp hạng người chơi của phiên này."
      roomCode={room?.code}
      phase="Hoàn thành"
      connected={isConnected}
    >
      <section className="rounded-2xl border-2 border-yellow-500/40 bg-red-900/90 p-6 shadow-[0_0_25px_rgba(234,179,8,0.2)] mx-auto w-full max-w-2xl">
        {ranking.length === 0 ? (
          <p className="text-yellow-200/60 font-medium text-center">
            Chưa có kết quả.
          </p>
        ) : null}
        <ol className="space-y-4">
          {ranking.map((player, index) => (
            <li
              key={player.id}
              className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all hover:scale-[1.01] ${
                index === 0
                  ? 'border-yellow-400 bg-gradient-to-r from-yellow-600 to-yellow-500 text-red-950 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-[1.02]'
                  : 'border-red-800 bg-red-950/80 text-yellow-100 hover:bg-red-900/80'
              }`}
            >
              <span
                className={`font-black text-lg uppercase tracking-wider ${
                  index === 0
                    ? 'text-red-950 drop-shadow-sm'
                    : 'text-yellow-300'
                }`}
              >
                Hạng {index + 1}: {player.nickname}
                {index === 0 ? <span className="ml-2">🏆</span> : null}
              </span>
              <span
                className={`font-black text-xl ${
                  index === 0
                    ? 'text-red-950'
                    : 'text-yellow-400 drop-shadow-md'
                }`}
              >
                {player.score} <span className="text-sm tracking-widest uppercase">Điểm</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-block rounded-full bg-gradient-to-b from-red-600 to-red-800 border-2 border-yellow-500 px-8 py-3 text-lg font-black uppercase tracking-widest text-yellow-300 shadow-[0_5px_15px_rgba(220,38,38,0.5)] transition-all hover:scale-105 hover:from-red-500 hover:to-red-700 active:scale-95"
          >
            Quay về trang vào phòng
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
