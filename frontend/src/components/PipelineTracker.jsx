import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../store/simStore'

// Etapas del pipeline con los statuses de orden que corresponden a cada una
const STAGES = [
  { key: 'order',    label: 'PEDIDO',   emoji: '📋', color: '#e94560', statuses: ['PENDING'] },
  { key: 'manager',  label: 'MANAGER',  emoji: '📱', color: '#4cc9f0', statuses: ['ACCEPTED'] },
  { key: 'chef',     label: 'COCINA',   emoji: '🔥', color: '#fbbf24', statuses: ['COOKING', 'BAKED', 'PACKED'] },
  { key: 'delivery', label: 'ENTREGA',  emoji: '🛵', color: '#4ade80', statuses: ['IN_DELIVERY', 'DELIVERED'] },
  { key: 'done',     label: 'LISTO',    emoji: '✅', color: '#a3e635', statuses: ['PAID', 'FREE'] },
]

function getStageIndex(status) {
  const idx = STAGES.findIndex(s => s.statuses.includes(status))
  return idx === -1 ? 0 : idx
}

function formatTime(secs) {
  if (secs == null || isNaN(secs)) return '--'
  const s = Math.floor(secs)
  return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`
}

export function PipelineTracker() {
  const orders  = useSimStore(s => s.orders)
  const simTime = useSimStore(s => s.simTime)

  // El pedido más reciente que NO está terminado aún
  const active = orders.find(o => !['PAID', 'FREE'].includes(o.status))
  // Si no hay activo, mostrar el último terminado (por un momento)
  const shown  = active || orders[0]

  if (!shown) return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '10px 16px', marginBottom: 12,
      color: 'var(--text-dim)', fontSize: '9px', textAlign: 'center',
    }}>
      ── Sin pedidos activos — presiona <strong style={{ color: 'var(--accent-green)' }}>+ PEDIDO</strong> para iniciar ──
    </div>
  )

  const stageIdx  = getStageIndex(shown.status)
  const elapsed   = shown.createdAt != null ? simTime - shown.createdAt : null
  const isDone    = ['PAID', 'FREE'].includes(shown.status)
  const isFree    = shown.status === 'FREE'

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '10px 16px', marginBottom: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Fila de título */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-dim)', letterSpacing: '1px' }}>
          ── PEDIDO EN CURSO ──
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
            🍕 {shown.items?.join(', ') || '—'}
          </div>
          {elapsed != null && (
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--fs-base)', fontWeight: 'bold',
              color: isFree ? '#ef4444' : isDone ? '#4ade80' : 'var(--accent-yellow)',
            }}>
              ⏱ {formatTime(elapsed)}
              {isFree && ' — ¡GRATIS! 🚨'}
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', color: 'var(--text-dim)' }}>
            #{String(shown.id).slice(-4).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Pipeline de etapas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STAGES.map((stage, i) => {
          const isPast   = i < stageIdx
          const isCurrent = i === stageIdx
          const isFuture = i > stageIdx

          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? 1 : 0 }}>
              {/* Nodo de etapa */}
              <motion.div
                animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  flexShrink: 0,
                }}
              >
                {/* Círculo */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: `2px solid ${isFuture ? 'var(--border)' : stage.color}`,
                  background: isCurrent ? stage.color + '33' : isPast ? stage.color + '22' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                  boxShadow: isCurrent ? `0 0 10px ${stage.color}88` : 'none',
                  opacity: isFuture ? 0.35 : 1,
                  position: 'relative',
                }}>
                  {stage.emoji}
                  {/* Pizza token encima del nodo actual */}
                  {isCurrent && (
                    <motion.div
                      animate={{ y: [-4, 0, -4] }}
                      transition={{ repeat: Infinity, duration: 1.0, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', top: -14, left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '12px',
                        filter: `drop-shadow(0 0 4px ${stage.color})`,
                      }}
                    >
                      🍕
                    </motion.div>
                  )}
                  {/* Check cuando está completado */}
                  {isPast && (
                    <div style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 12, height: 12, borderRadius: '50%',
                      background: stage.color, fontSize: '7px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✓</div>
                  )}
                </div>
                {/* Label */}
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)',
                  letterSpacing: '0.5px',
                  color: isCurrent ? stage.color : isFuture ? 'var(--text-dim)' : stage.color,
                  opacity: isFuture ? 0.4 : 1,
                  fontWeight: isCurrent ? 'bold' : 'normal',
                }}>
                  {stage.label}
                </div>
              </motion.div>

              {/* Conector entre etapas */}
              {i < STAGES.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 4px', marginBottom: 16, position: 'relative' }}>
                  {/* Base gris */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--border)', borderRadius: 1,
                  }} />
                  {/* Progreso de color */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isPast ? '100%' : isCurrent ? '50%' : '0%' }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: 'absolute', top: 0, left: 0, height: '100%',
                      background: stage.color, borderRadius: 1,
                    }}
                  />
                  {/* Pizza viajando por el conector */}
                  {isCurrent && (
                    <motion.div
                      animate={{ left: ['0%', '100%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', top: -5, fontSize: '10px',
                        transform: 'translateX(-50%)',
                      }}
                    >🍕</motion.div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
