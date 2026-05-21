import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { DeliveryRobot } from './sprites/DeliveryRobot'
import { ClienteHouse } from './sprites/ClienteHouse'

// DeliveryZone — 50% del pipeline.
// El Delivery bot se mueve entre las casas de los clientes.
// Las casas aparecen dinámicamente cuando un pedido es despachado.
export function DeliveryZone() {
  const agentActions    = useSimStore(s => s.agentActions.delivery)
  const agentStates     = useSimStore(s => s.agentStates.delivery)
  const deliveryHouses  = useSimStore(s => s.deliveryHouses)

  const action    = agentActions.action
  const moving    = agentActions.moving
  const returning = agentActions.returning

  // Posición X del delivery robot en la zona (0 = izquierda = pizzería, 1 = derecha = cliente)
  const deliveryX = returning ? '5%'
    : action === 'delivered' ? '80%'
    : moving ? '60%'
    : '5%'

  return (
    <div style={{
      width: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      padding: '12px 8px 8px',
      background: 'linear-gradient(180deg, #0d1b2a 0%, #1a3045 100%)',
      borderRadius: '0 8px 8px 0',
      position: 'relative',
      minHeight: '260px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
        color: '#4ade80', fontSize: '7px', letterSpacing: '2px', whiteSpace: 'nowrap',
      }}>
        ── CALLE / ENTREGAS ──
      </div>

      {/* Casas de clientes — aparecen cuando hay entregas activas */}
      <div style={{
        position: 'absolute', bottom: '90px', left: '0', right: '0',
        display: 'flex', alignItems: 'flex-end', gap: '8px', paddingLeft: '20%',
      }}>
        <AnimatePresence>
          {deliveryHouses.map((house) => (
            <motion.div
              key={house.orderId}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ClienteHouse
                size={55}
                delivered={house.delivered}
                orderId={house.orderId}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Placeholder cuando no hay entregas */}
        {deliveryHouses.length === 0 && (
          <div style={{ color: '#1e3a4f', fontSize: '8px', paddingLeft: '20px' }}>
            esperando entregas...
          </div>
        )}
      </div>

      {/* Línea de calle */}
      <div style={{
        position: 'absolute', bottom: '68px', left: 0, right: 0,
        height: '3px', background: 'repeating-linear-gradient(90deg, #334155 0, #334155 12px, transparent 12px, transparent 24px)',
      }} />

      {/* Delivery Robot — se mueve horizontalmente */}
      <motion.div
        animate={{ left: deliveryX }}
        transition={{ duration: moving ? 1.5 : returning ? 2.0 : 0.3, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: '32px',
          left: deliveryX,
        }}
      >
        <DeliveryRobot size={65} moving={moving} returning={returning} />
      </motion.div>

      {/* Flecha de dirección */}
      {moving && (
        <motion.div
          animate={{ x: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{
            position: 'absolute', bottom: '50px', left: '45%',
            color: '#4ade80', fontSize: '16px',
          }}
        >
          ►
        </motion.div>
      )}
      {returning && (
        <motion.div
          animate={{ x: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{
            position: 'absolute', bottom: '50px', left: '35%',
            color: '#fbbf24', fontSize: '16px',
          }}
        >
          ◄
        </motion.div>
      )}

      {/* Estado */}
      <div style={{
        position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
        color: '#166534', fontSize: '8px', whiteSpace: 'nowrap',
      }}>
        {agentStates.status || 'idle'}
      </div>
    </div>
  )
}
