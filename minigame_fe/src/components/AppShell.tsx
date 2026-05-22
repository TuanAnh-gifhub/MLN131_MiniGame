import type { PropsWithChildren, ReactNode } from 'react'
import backgroundImage from '../assets/background.jpg'

interface AppShellProps extends PropsWithChildren {
  title: string
  subtitle?: string
  roomCode?: string
  phase?: string
  role?: string
  connected?: boolean
  headerRight?: ReactNode
  backgroundImageUrl?: string
  headerClassName?: string
}

export function AppShell({
  title,
  subtitle,
  roomCode,
  phase,
  role,
  connected,
  headerRight,
  backgroundImageUrl,
  headerClassName,
  children,
}: AppShellProps) {
  const headerClasses = `mb-8 rounded-2xl border-2 border-yellow-500/50 bg-red-800/90 p-6 backdrop-blur shadow-[0_0_28px_rgba(234,179,8,0.25)]${headerClassName ? ` ${headerClassName}` : ''}`
  const backgroundUrl = backgroundImageUrl ?? backgroundImage

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-red-950 bg-cover bg-center bg-no-repeat text-red-50"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(220,38,38,0.4),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(234,179,8,0.2),transparent_24%),radial-gradient(circle_at_100%_80%,rgba(185,28,28,0.3),transparent_30%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <header className={headerClasses}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {roomCode ? <span className="chip">Phòng {roomCode}</span> : null}
            {phase ? <span className="chip chip-brand">{phase}</span> : null}
            {role ? <span className="chip">{role}</span> : null}
            {connected !== undefined ? (
              <span className={`chip ${connected ? 'chip-ok' : 'chip-bad'}`}>{connected ? 'Đã kết nối thời gian thực' : 'Mất kết nối'}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-black tracking-tight text-yellow-400 uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] md:text-4xl">
              {title}
            </h1>
            {headerRight ? <div>{headerRight}</div> : null}
          </div>
          {subtitle ? <p className="mt-2 max-w-3xl text-yellow-200/85 text-lg font-medium">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </main>
  )
}
