import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ManagerZone } from './ManagerZone'
import { ChefZone } from './ChefZone'
import { DeliveryZone } from './DeliveryZone'

// Altura fija para que el piso quede alineado en las 3 zonas — clave para el efecto
// de "escena continua" estilo videojuego. Sin esto, cada zona tiene distinto alto.
const SCENE_HEIGHT = 340

export function SimViewer() {
  const comandaFlying = useSimStore(s => s.comandaFlying)

  return (
    <div style={{
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '2px solid #1e293b',
      height: SCENE_HEIGHT,
      display: 'flex',
    }}>
      <ManagerZone height={SCENE_HEIGHT} />
      <ChefZone    height={SCENE_HEIGHT} />
      <DeliveryZone height={SCENE_HEIGHT} />

      {/* Comanda volando Manager → Chef */}
      <AnimatePresence>
        {comandaFlying && (
          <motion.div
            key="comanda"
            initial={{ left: '10%', opacity: 1, scale: 1.2 }}
            animate={{ left: '24%', opacity: 0.9, scale: 0.8 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '42%',
              fontSize: '22px',
              zIndex: 20,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 0 8px #fbbf24)',
            }}
          >
            📋
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
