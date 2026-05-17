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
            className={`rounded-xl border-2 p-4 transition-all ${
              isCurrent
                ? 'border-yellow-400 bg-gradient-to-r from-red-800 to-red-900 shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-[1.02]'
                : 'border-red-800 bg-red-950/80 hover:bg-red-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold ${isCurrent ? 'text-yellow-300' : 'text-yellow-100'} text-lg tracking-wide uppercase`}>
                #{index + 1} {player.nickname}
              </span>
              <span className="text-xl font-black text-yellow-400 drop-shadow-md">{player.score} <span className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Điểm</span></span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase font-bold tracking-wider">
              <span className={`rounded-full px-3 py-1 ${player.host ? 'border border-yellow-500 bg-yellow-500/20 text-yellow-300' : 'border border-red-700 bg-red-800 text-red-300'}`}>
                {player.host ? 'Quản Trị' : 'Người Chơi'}
              </span>
              <span className={`rounded-full px-3 py-1 ${player.connected ? 'border border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border border-slate-500 bg-slate-600/30 text-slate-400'}`}>
                {player.connected ? 'Online' : 'Offline'}
              </span>
              {isCurrent ? <span className="rounded-full border border-yellow-400 bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-1 text-red-950 shadow-sm animate-pulse">Đang chơi</span> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

