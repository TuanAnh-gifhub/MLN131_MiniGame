import { useEffect, useState } from 'react'
import { socketClient } from '../services/socketClient'

const WHEEL_OPTIONS = [400, 'BANKRUPT', 200, 700, 'LOSE_TURN', 500, 100, 800, 300, 600] as const

interface SpinWheelProps {
  roomCode: string
  nickname: string
  isMyTurn: boolean
  spinRequired: boolean
  latestEvent: any
}

export function SpinWheel({ roomCode, nickname, isMyTurn, spinRequired, latestEvent }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)

  // When we receive the result from the backend
  useEffect(() => {
    if (!spinning || !latestEvent || latestEvent.eventType !== 'GAME_UPDATE') return

    const reason = latestEvent.payload?.reason as string
    if (reason === 'SPIN_OK' || reason === 'LOSE_TURN' || reason === 'BANKRUPT') {
      let targetOption: (typeof WHEEL_OPTIONS)[number] | undefined

      if (reason === 'LOSE_TURN') {
        targetOption = 'LOSE_TURN'
      } else if (reason === 'BANKRUPT') {
        targetOption = 'BANKRUPT'
      } else if (reason === 'SPIN_OK') {
        targetOption = latestEvent.payload?.spinScore as number
      }

      if (targetOption !== undefined) {
        const optionIndex = WHEEL_OPTIONS.indexOf(targetOption)
        if (optionIndex !== -1) {
          // Calculate rotation
          const slices = WHEEL_OPTIONS.length
          const sliceAngle = 360 / slices
          // Extra rotations for effect (e.g. 5 full rotations)
          const extraRotations = 360 * 5
          // We want the target slice to be at the top.
          // The first slice (index 0) is from 0 to 36 degrees. Top is at 18 deg or 0 deg depending on how we render.
          // Let's render slices starting from top. So slice i starts at i * sliceAngle.
          // To land on slice i, we rotate backwards by (i * sliceAngle) + random offset within slice.
          const targetRotation = extraRotations - (optionIndex * sliceAngle) - (sliceAngle / 2)
          
          // Animate to target
          setRotation((prev) => prev + targetRotation)
          
          // Wait for animation to finish
          setTimeout(() => {
            setSpinning(false)
          }, 3000)
        }
      }
    }
  }, [latestEvent, spinning])

  const handleSpin = () => {
    if (!isMyTurn || !spinRequired || spinning) return
    setSpinning(true)
    
    // First, start a generic fast spin visually (or just wait for backend to respond which is instant)
    
    // Send event to backend
    socketClient.publish(roomCode, {
      eventType: 'GUESS_LETTER',
      actor: nickname,
      payload: 'SPIN',
    })
  }

  // Render the wheel using conic-gradient
  const slices = WHEEL_OPTIONS.length
  const conicGradient = WHEEL_OPTIONS.map((opt, i) => {
    const start = (i * 100) / slices
    const end = ((i + 1) * 100) / slices
    const color = typeof opt === 'number' 
      ? (i % 2 === 0 ? '#b91c1c' : '#ca8a04') 
      : opt === 'LOSE_TURN' ? '#9a3412' : '#000000'
    return `${color} ${start}% ${end}%`
  }).join(', ')

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-64 w-64">
        {/* Pointer */}
        <div className="absolute left-1/2 top-[-15px] z-10 -ml-5 h-0 w-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        
        {/* Wheel */}
        <div
          className="h-full w-full rounded-full border-[6px] border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-transform duration-[3000ms] ease-out"
          style={{
            background: `conic-gradient(${conicGradient})`,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Labels */}
          {WHEEL_OPTIONS.map((opt, i) => {
            const rotateDeg = i * (360 / slices) + (360 / slices) / 2
            return (
              <div
                key={i}
                className={`absolute left-1/2 top-1/2 flex h-full -translate-x-1/2 -translate-y-1/2 origin-center items-start pt-4 text-sm font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] uppercase ${i % 2 === 0 ? 'text-yellow-400' : 'text-red-950'}`}
                style={{ transform: `translate(-50%, -50%) rotate(${rotateDeg}deg)` }}
              >
                {opt === 'LOSE_TURN' ? 'MẤT LƯỢT' : opt === 'BANKRUPT' ? <span className="text-white">MẤT ĐIỂM</span> : opt}
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSpin}
        disabled={!isMyTurn || !spinRequired || spinning}
        className="rounded-full bg-gradient-to-b from-red-600 to-red-800 border-2 border-yellow-500 px-8 py-3 text-lg font-black uppercase tracking-wider text-yellow-300 shadow-[0_5px_15px_rgba(220,38,38,0.5)] transition-all hover:scale-105 hover:from-red-500 hover:to-red-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
      >
        {spinning ? 'Đang quay...' : 'Vòng Quay Kỳ Diệu'}
      </button>
    </div>
  )
}
