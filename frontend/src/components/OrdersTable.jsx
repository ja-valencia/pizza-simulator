import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../store/simStore'

const PRICE_PER_PIZZA = 10  // $ por pizza

// Colores por status del pedido
const STATUS_COLORS = {
  PENDING:     '#94a3b8',
  ACCEPTED:    '#4cc9f0',
  COOKING:     '#f97316',
  BAKED:       '#fbbf24',
  PACKED:      '#a3e635',
  IN_DELIVERY: '#4ade80',
  DELIVERED:   '#22d3ee',
  PAID:        '#4ade80',
  FREE:        '#ef4444',
  FAILED:      '#7f1d1d',
}

const STATUS_LABELS = {
  PENDING: 'PENDIENTE', ACCEPTED: 'ACEPTADO', COOKING: 'HORNEANDO',
  BAKED: 'LISTO', PACKED: 'EMPACADO', IN_DELIVERY: 'EN CAMINO',
  DELIVERED: 'ENTREGADO', PAID: 'PAGADO', FREE: 'GRATIS', FAILED: 'FALLIDO',
}

function formatWallTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDuration(createdIso, deliveredIso) {
  if (!createdIso || !deliveredIso) return '—'
  const ms = new Date(deliveredIso) - new Date(createdIso)
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s/60)}m ${s%60}s`
}

function MontoCell({ status, itemCount }) {
  if (status !== 'PAID' && status !== 'FREE') {
    return <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>—</span>
  }
  const total = itemCount * PRICE_PER_PIZZA
  const isFree = status === 'FREE'
  return (
    <span style={{
      color: isFree ? '#ef4444' : '#4ade80',
      fontFamily: 'var(--font-body)',
      fontWeight: 'bold',
      fontSize: 'var(--fs-base)',
    }}>
      {isFree ? `−$${total}` : `+$${total}`}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span style={{
      background: (STATUS_COLORS[status] || '#94a3b8') + '22',
      color: STATUS_COLORS[status] || '#94a3b8',
      border: `1px solid ${STATUS_COLORS[status] || '#94a3b8'}44`,
      borderRadius: 3, padding: '2px 6px',
      fontFamily: 'var(--font-pixel)', fontSize: 9,
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

const TH = ({ children, align = 'left' }) => (
  <th style={{
    padding: '8px 10px', textAlign: align,
    fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)',
    color: 'var(--text-dim)', borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap', fontWeight: 'normal',
  }}>{children}</th>
)

const TD = ({ children, align = 'left', style: s }) => (
  <td style={{
    padding: '7px 10px', textAlign: align,
    fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)',
    color: 'var(--text-primary)', borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle', ...s,
  }}>{children}</td>
)

export function OrdersTable() {
  const orders = useSimStore(s => s.orders)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 6, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 14px', borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)',
        color: 'var(--text-dim)', letterSpacing: '1px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>── ÓRDENES</span>
        <span style={{ color: 'var(--accent-yellow)' }}>({orders.length})</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-dim)' }}>
          ${PRICE_PER_PIZZA} por pizza · <span style={{ color: '#ef4444' }}>−</span> gratis · <span style={{ color: '#4ade80' }}>+</span> cobrado
        </span>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
            <tr>
              <TH>#</TH>
              <TH align="center">🍕</TH>
              <TH>PEDIDO</TH>
              <TH>STATUS</TH>
              <TH>ENTREGA</TH>
              <TH>DURACIÓN</TH>
              <TH align="right">MONTO</TH>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {orders.map((order, idx) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, backgroundColor: '#4cc9f033' }}
                  animate={{ opacity: 1, backgroundColor: 'transparent' }}
                  transition={{ duration: 0.4 }}
                  style={{ cursor: 'default' }}
                >
                  <TD style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--text-dim)' }}>
                    #{String(order.id).slice(-4).toUpperCase()}
                  </TD>
                  <TD align="center">
                    <span title={order.items?.join(', ')} style={{ fontWeight: 'bold', color: 'var(--accent-yellow)' }}>
                      {order.items?.length ?? '?'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>
                      {order.items?.join(', ')}
                    </span>
                  </TD>
                  <TD style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    {formatWallTime(order.wallCreatedAt)}
                  </TD>
                  <TD><StatusBadge status={order.status} /></TD>
                  <TD style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    {formatWallTime(order.wallDeliveredAt)}
                  </TD>
                  <TD style={{ whiteSpace: 'nowrap' }}>
                    {formatDuration(order.wallCreatedAt, order.wallDeliveredAt)}
                  </TD>
                  <TD align="right">
                    <MontoCell status={order.status} itemCount={order.items?.length ?? 0} />
                  </TD>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {orders.length === 0 && (
          <div style={{
            padding: '24px', textAlign: 'center',
            fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)',
            color: 'var(--text-dim)',
          }}>
            Sin órdenes aún — presiona <strong style={{ color: 'var(--accent-green)' }}>+ PEDIDO</strong> para comenzar
          </div>
        )}
      </div>
    </div>
  )
}
