import { motion, AnimatePresence } from 'framer-motion'

// AgentSprite: representación visual de un agente.
// HOY: emoji grande con animación Framer Motion.
// FASE 6: reemplazar el emoji por un <img> con sprite PNG 8-bit.
//         La clase pixel-art ya está lista; solo cambiar el contenido interno.

const AGENT_CONFIG = {
  manager:  { emoji: '📋', label: 'MANAGER',  color: '#4cc9f0' },
  chef:     { emoji: '👨‍🍳', label: 'CHEF',     color: '#fbbf24' },
  delivery: { emoji: '🛵', label: 'DELIVERY', color: '#4ade80' },
  cliente:  { emoji: '🧑', label: 'CLIENTE',  color: '#e94560' },
}

// Variantes de animación por tipo de evento
// animKey en el store cambia con cada evento → Framer Motion re-dispara
const animations = {
  PIZZA_BAKED:         { y: [0, -12, 0], transition: { duration: 0.4 } },
  DELIVERED:           { scale: [1, 1.3, 1], transition: { duration: 0.4 } },
  PAYMENT_RECEIVED:    { rotate: [0, -10, 10, 0], transition: { duration: 0.3 } },
  PAYMENT_FREE:        { x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.5 } },
  STATION_CLEANING:    { x: [0, -4, 4, -4, 4, 0], transition: { duration: 0.4 } },
  DELIVERY_DISPATCHED: { x: [0, 8, 0], transition: { duration: 0.5 } },
  default:             { scale: [1, 1.1, 1], transition: { duration: 0.2 } },
}

export function AgentSprite({ type, status, message, animKey, cooking, inTransit }) {
  const config = AGENT_CONFIG[type] || AGENT_CONFIG.manager
  const anim = animations[status] || animations.default

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Sprite container — pixel-art class preparada para PNG en Fase 6 */}
      <motion.div
        key={animKey}
        animate={anim}
        className="pixel-art text-5xl select-none cursor-default"
        style={{ filter: cooking ? 'drop-shadow(0 0 8px #f97316)' : 'none' }}
      >
        {config.emoji}
      </motion.div>

      {/* Label del agente */}
      <div style={{ color: config.color }} className="text-xs font-bold tracking-widest">
        {config.label}
      </div>

      {/* Estado actual */}
      <div className="text-center text-xs" style={{ color: '#94a3b8', maxWidth: '100px', minHeight: '2em' }}>
        {status || 'idle'}
      </div>

      {/* Mensaje del LLM (narrativa del agente) */}
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center italic"
            style={{ color: '#64748b', fontSize: '9px', maxWidth: '120px', minHeight: '2em' }}
          >
            "{message.slice(0, 60)}{message.length > 60 ? '...' : ''}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
