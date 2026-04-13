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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.3),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.22),transparent_24%),radial-gradient(circle_at_100%_80%,rgba(250,204,21,0.16),transparent_30%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-8 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {roomCode ? <span className="chip">Phòng {roomCode}</span> : null}
            {phase ? <span className="chip chip-brand">{phase}</span> : null}
            {role ? <span className="chip">{role}</span> : null}
            {connected !== undefined ? (
              <span className={`chip ${connected ? 'chip-ok' : 'chip-bad'}`}>{connected ? 'Đã kết nối thời gian thực' : 'Mất kết nối'}</span>
            ) : null}
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-3xl text-slate-300">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </main>
  )
}

