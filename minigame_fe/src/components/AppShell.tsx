import type { PropsWithChildren } from 'react'

interface AppShellProps extends PropsWithChildren {
  title: string
  subtitle?: string
  roomCode?: string
  phase?: string
  role?: string
  connected?: boolean
}

export function AppShell({ title, subtitle, roomCode, phase, role, connected, children }: AppShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-red-950 text-red-50 font-serif">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(220,38,38,0.4),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(234,179,8,0.2),transparent_24%),radial-gradient(circle_at_100%_80%,rgba(185,28,28,0.3),transparent_30%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-8 rounded-2xl border-2 border-yellow-500/40 bg-red-900/80 p-6 backdrop-blur shadow-[0_0_25px_rgba(234,179,8,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
            <svg width="80" height="80" viewBox="0 0 51 48" fill="#eab308">
              <path d="M25.5 0l6.37 19.55h20.6L35.8 31.6l6.38 19.55-16.68-12.08L8.82 51.15l6.38-19.55L-1.47 19.55h20.6z"/>
            </svg>
          </div>
          <div className="relative z-10 mb-4 flex flex-wrap items-center gap-2">
            {roomCode ? <span className="chip">Room {roomCode}</span> : null}
            {phase ? <span className="chip chip-brand">{phase}</span> : null}
            {role ? <span className="chip">{role}</span> : null}
            {connected !== undefined ? (
              <span className={`chip ${connected ? 'chip-ok' : 'chip-bad'}`}>{connected ? 'Realtime Connected' : 'Disconnected'}</span>
            ) : null}
          </div>

          <h1 className="text-3xl font-black tracking-tight text-yellow-400 md:text-5xl uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-3xl text-yellow-200/80 text-lg font-medium">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </main>
  )
}

