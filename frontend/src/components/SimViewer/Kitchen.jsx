import { motion } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { AgentSprite } from './AgentSprite'

// Zona Cocina: donde vive el Chef.
// Muestra el horno con animación de calor cuando está cocinando.
export function Kitchen() {
  const chef = useSimStore(s => s.agentStates.chef)

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 p-4 rounded-lg h-full"
      style={{ background: 'var(--bg-kitchen)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>
        ── COCINA ──
      </div>

      {/* Horno: pulsa en rojo cuando el chef está cocinando */}
      <motion.div
        className="text-4xl"
        animate={chef.cooking
          ? { filter: ['drop-shadow(0 0 4px #f97316)', 'drop-shadow(0 0 16px #ef4444)', 'drop-shadow(0 0 4px #f97316)'] }
          : { filter: 'drop-shadow(0 0 0px transparent)' }
        }
        transition={{ repeat: Infinity, duration: 1.2 }}
      >
        🔥
      </motion.div>

      <AgentSprite
        type="chef"
        status={chef.status}
        message={chef.message}
        animKey={chef.animKey}
        cooking={chef.cooking}
      />
    </div>
  )
}
