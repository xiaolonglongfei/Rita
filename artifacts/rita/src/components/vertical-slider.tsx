import { useRef, useEffect } from 'react'

interface VerticalSliderProps {
  label: string
  emoji: string
  value: number
  onChange: (value: number) => void
}

const TRACK_H = 220
const THUMB_H = 44

function scoreColor(v: number): string {
  if (v >= 4.0) return '#1668c8'
  if (v >= 2.5) return '#c89000'
  return '#c83030'
}

export function VerticalSlider({ label, emoji, value, onChange }: VerticalSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const color = scoreColor(value)
  const pct = value / 5
  const fillH = pct * TRACK_H
  const thumbBottom = pct * (TRACK_H - THUMB_H)

  function valFromClientY(clientY: number): number {
    if (!trackRef.current) return value
    const rect = trackRef.current.getBoundingClientRect()
    const relY = clientY - rect.top - THUMB_H / 2
    const usable = TRACK_H - THUMB_H
    const pct = 1 - relY / usable
    const raw = pct * 5
    return Math.max(0, Math.min(5, Math.round(raw * 10) / 10))
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (dragging.current) onChange(valFromClientY(e.clientY))
    }
    function onTouchMove(e: TouchEvent) {
      if (dragging.current) {
        e.preventDefault()
        onChange(valFromClientY(e.touches[0].clientY))
      }
    }
    function onUp() { dragging.current = false }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [value])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-2xl font-bold transition-colors duration-200" style={{ color }}>
        {value.toFixed(1)}
      </div>

      <div
        ref={trackRef}
        className="relative cursor-pointer"
        style={{ width: 52, height: TRACK_H }}
        onClick={(e) => onChange(valFromClientY(e.clientY))}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: 18, height: TRACK_H, background: '#e8f1fc' }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bottom-0 transition-colors duration-200"
          style={{ width: 18, height: fillH, background: color }}
        />
        <div
          className="absolute right-0.5 top-0 flex flex-col justify-between pointer-events-none"
          style={{ height: TRACK_H }}
        >
          {[5, 4, 3, 2, 1, 0].map(t => (
            <span key={t} className="text-xs text-slate-300 leading-none">{t}</span>
          ))}
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white flex items-center justify-center text-xs font-bold select-none transition-colors duration-200"
          style={{
            width: THUMB_H,
            height: THUMB_H,
            bottom: thumbBottom,
            border: `3px solid ${color}`,
            color,
            boxShadow: '0 2px 10px rgba(26,104,200,0.2)',
            cursor: 'grab',
          }}
          onMouseDown={() => { dragging.current = true }}
          onTouchStart={(e) => {
            dragging.current = true
            e.preventDefault()
          }}
        >
          {value.toFixed(1)}
        </div>
      </div>

      <div className="text-xs font-semibold text-slate-500 text-center" style={{ maxWidth: 72 }}>
        {emoji} {label}
      </div>
    </div>
  )
}
