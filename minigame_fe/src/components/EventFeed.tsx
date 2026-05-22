import type { GameOutboundMessage } from '../types/socket'

interface EventFeedProps {
  items: GameOutboundMessage[]
}

export function EventFeed({ items }: EventFeedProps) {
  const toneByEvent = (eventType: string): string => {
    if (eventType === 'TURN_CHANGE') return 'border-yellow-300/40 bg-yellow-500/15 text-yellow-100'
    if (eventType === 'GAME_END') return 'border-yellow-300/50 bg-yellow-500/20 text-yellow-100'
    if (eventType === 'START_GAME') return 'border-amber-300/50 bg-amber-500/15 text-amber-100'
    return 'border-yellow-500/20 bg-red-950/70 text-yellow-100'
  }

  return (
    <section className="rounded-2xl border border-yellow-500/30 bg-red-900/70 p-4">
      <h3 className="mb-3 text-lg font-semibold title-md">Bảng sự kiện thời gian thực</h3>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? <p className="text-sm text-yellow-200/80">Chưa có sự kiện nào.</p> : null}
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
