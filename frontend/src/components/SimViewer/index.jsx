import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ManagerZone } from './ManagerZone'
import { ChefZone } from './ChefZone'
import { DeliveryZone } from './DeliveryZone'

// SimViewer — Pipeline visual de izquierda a derecha estilo Nintendo 8-bit.
// Proporciones: Manager 20% | Chef 30% | Delivery 50%
// La "comanda volando" es un overlay absoluto que atraviesa las zonas.
export function SimViewer() {
  const comandaFlying = useSimStore(s => s.comandaFlying)

  return (
    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* Pipeline horizontal */}
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '260px' }}>
        <ManagerZone />
        <ChefZone />
        <DeliveryZone />
      </div>

      {/* Comanda volando de Manager → Chef (overlay absoluto) */}
      <AnimatePresence>
        {comandaFlying && (
          <motion.div
            key="comanda"
            initial={{ left: '10%', opacity: 1, scale: 1 }}
            animate={{ left: '22%', opacity: 0.9, scale: 0.8 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '40%',
              fontSize: '20px',
              zIndex: 10,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 6px #fbbf24)',
            }}
          >
            📋
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
