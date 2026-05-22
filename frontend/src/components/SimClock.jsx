import { useSimStore } from '../store/simStore'

// Formatea el tiempo de simulación según la unidad preferida
function formatTime(seconds, unit) {
  const s = Math.floor(seconds)
  if (unit === 'min') {
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}m ${rem.toString().padStart(2, '0')}s`
  }
  if (unit === 'hr') {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }
  // 'sec' por defecto — MM:SS
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const r = (s % 60).toString().padStart(2, '0')
  return `${m}:${r}`
}

export function SimClock() {
  const { simTime, isRunning, speed, timeUnit } = useSimStore()

  return (
    <div className="flex items-center gap-4">
      <span style={{ color: isRunning ? 'var(--accent-green)' : 'var(--text-dim)' }}>
        {isRunning ? '▶' : '⏹'}
      </span>
      <span style={{ color: 'var(--accent-blue)', fontSize: '14px' }}>
        ⏰ {formatTime(simTime, timeUnit || 'sec')}
      </span>
      <span style={{ color: 'var(--accent-yellow)', fontSize: '10px' }}>
        {speed}x
      </span>
    </div>
  )
}
