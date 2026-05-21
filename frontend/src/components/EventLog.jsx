import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../store/simStore'
import { useSound } from '../hooks/useSound'
import { useEffect, useRef } from 'react'

const AGENT_COLORS = {
  manager:  '#4cc9f0',
  chef:     '#fbbf24',
  delivery: '#4ade80',
  cliente:  '#e94560',
  system:   '#64748b',
}

const AGENT_EMOJI = {
  manager: '📋', chef: '👨‍🍳', delivery: '🛵', cliente: '🧑',
}

// EventLog: feed en tiempo real de eventos del simulador.
// Razón de mostrar los últimos 15: más eventos saturan la UI y dificultan la lectura.
// Los eventos entran por arriba (más recientes primero) con fade-in.
export function EventLog() {
  const recentEvents = useSimStore(s => s.recentEvents)
  const { play } = useSound()
  const prevCountRef = useRef(0)

  // Reproducir sonido cuando llega un evento nuevo
  useEffect(() => {
    if (recentEvents.length > prevCountRef.current) {
      const newest = recentEvents[0]
      if (newest) play(newest.type)
    }
    prevCountRef.current = recentEvents.length
  }, [recentEvents, play])

  return (
    <div
      className="rounded-lg p-3 overflow-y-auto"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '200px' }}
    >
      <div className="text-xs mb-2 tracking-widest" style={{ color: 'var(--text-dim)' }}>
        ── EVENT LOG ──
      </div>

      <AnimatePresence initial={false}>
        {recentEvents.map(event => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 items-start mb-1"
            style={{ fontSize: '9px' }}
          >
            <span style={{ color: 'var(--text-dim)', minWidth: '40px' }}>
              {event.sim_time ? Math.floor(event.sim_time) + 's' : '--'}
            </span>
            <span>{AGENT_EMOJI[event.agent] || '⚙️'}</span>
            <span style={{ color: AGENT_COLORS[event.agent] || '#94a3b8' }}>
              {event.type}
            </span>
            {event.payload?.message && (
              <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                — {event.payload.message.slice(0, 50)}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {recentEvents.length === 0 && (
        <div style={{ color: 'var(--text-dim)', fontSize: '9px' }}>
          esperando eventos...
        </div>
      )}
    </div>
  )
}
