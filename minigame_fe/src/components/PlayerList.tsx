import type { PlayerView } from '../types/room'

interface PlayerListProps {
  players: PlayerView[]
  currentTurnPlayerId?: string
}

export function PlayerList({ players, currentTurnPlayerId }: PlayerListProps) {
  return (
    <ul className="grid gap-2">
      {players.map((player, index) => {
        const isCurrent = currentTurnPlayerId === player.id
        return (
          <li
            key={player.id}
            className={`rounded-lg border px-3 py-2 transition-all ${
              isCurrent
                ? 'border-yellow-400 bg-gradient-to-r from-red-900 to-red-950 shadow-[0_0_12px_rgba(234,179,8,0.25)] scale-[1.01]'
                : 'border-red-900 bg-red-950/60 hover:bg-red-900/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold ${isCurrent ? 'text-yellow-300' : 'text-yellow-100'} text-sm uppercase tracking-wide`}>
                  #{index + 1} {player.nickname}
                </span>
                <div className="flex gap-1.5 text-[9px] uppercase font-black tracking-wider">
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      player.host ? 'border border-yellow-500/30 bg-yellow-500/10 text-yellow-300' : 'border border-red-700/30 bg-red-800/10 text-red-300'
                    }`}
                  >
                    {player.host ? 'Chủ phòng' : 'Người chơi'}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      player.connected ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border border-slate-500/30 bg-slate-600/10 text-slate-400'
                    }`}
                  >
                    {player.connected ? 'Online' : 'Offline'}
                  </span>
                  {isCurrent ? (
                    <span className="rounded border border-yellow-400 bg-gradient-to-r from-yellow-500 to-yellow-600 px-1.5 py-0.5 text-red-950 animate-pulse font-black">
                      Đang chơi
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="text-base font-black text-yellow-400 drop-shadow-sm flex items-center gap-1 shrink-0">
                {player.score} <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide">Điểm</span>
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

