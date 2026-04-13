import type { PlayerView } from '../types/room'

interface PlayerListProps {
  players: PlayerView[]
  currentTurnPlayerId?: string
}

export function PlayerList({ players, currentTurnPlayerId }: PlayerListProps) {
  return (
    <ul className="grid gap-3">
      {players.map((player, index) => {
        const isCurrent = currentTurnPlayerId === player.id
        return (
          <li
            key={player.id}
            className={`rounded-xl border p-4 transition ${
              isCurrent
                ? 'border-amber-300 bg-gradient-to-r from-amber-500/30 to-orange-500/20 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                : 'border-slate-700 bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-100">
                #{index + 1} {player.nickname}
              </span>
              <span className="text-sm font-semibold text-amber-200">{player.score} điểm</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className={`rounded-full px-2 py-0.5 ${player.host ? 'bg-blue-500/20 text-blue-100' : 'bg-slate-700 text-slate-200'}`}>
                {player.host ? 'Chủ phòng' : 'Người chơi'}
              </span>
              <span className={`rounded-full px-2 py-0.5 ${player.connected ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'}`}>
                {player.connected ? 'Trực tuyến' : 'Ngoại tuyến'}
              </span>
              {isCurrent ? <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-100">Đang đến lượt</span> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

