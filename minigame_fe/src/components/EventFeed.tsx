import type { GameOutboundMessage } from '../types/socket'

interface EventFeedProps {
  items: GameOutboundMessage[]
}

export function EventFeed({ items }: EventFeedProps) {
  const toneByEvent = (eventType: string): string => {
    if (eventType === 'TURN_CHANGE') return 'border-amber-300/40 bg-amber-500/10 text-amber-100'
    if (eventType === 'GAME_END') return 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100'
    if (eventType === 'START_GAME') return 'border-blue-300/40 bg-blue-500/10 text-blue-100'
    return 'border-slate-600/60 bg-slate-800/80 text-slate-200'
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4">
      <h3 className="mb-3 text-lg font-semibold text-slate-100">Realtime Feed</h3>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? <p className="text-sm text-slate-400">No events yet.</p> : null}
        {items.map((item, index) => (
          <article
            key={`${item.serverTime}-${index}`}
            className={`rounded-lg border p-2 text-sm transition ${toneByEvent(item.eventType)}`}
          >
            <div className="font-semibold">{item.eventType}</div>
            <div className="text-xs opacity-90">{item.actor}</div>
            <div className="text-[11px] opacity-70">{new Date(item.serverTime).toLocaleTimeString()}</div>
          </article>
        ))}
      </div>
    </section>
  )
}

