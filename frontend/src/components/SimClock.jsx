import { useSimStore } from '../store/simStore'

// Formatea segundos de simulación en MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// SimClock: muestra el tiempo de simulación y la velocidad actual.
// El simTime viene del CLOCK_TICK del backend vía WebSocket.
export function SimClock() {
  const { simTime, isRunning, speed } = useSimStore()

  return (
    <div className="flex items-center gap-4">
      <span style={{ color: isRunning ? 'var(--accent-green)' : 'var(--text-dim)' }}>
        {isRunning ? '▶' : '⏹'}
      </span>
      <span style={{ color: 'var(--accent-blue)', fontSize: '14px' }}>
        ⏰ {formatTime(simTime)}
      </span>
      <span style={{ color: 'var(--accent-yellow)', fontSize: '10px' }}>
        {speed}x
      </span>
    </div>
  )
}
