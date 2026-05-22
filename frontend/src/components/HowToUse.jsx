import { useState } from 'react'

const STEPS = [
  {
    n: '①',
    title: 'START',
    desc: 'Presiona ▶ START para iniciar el reloj de simulación.',
    hint: 'Sin esto, los pedidos no se procesan.',
    color: '#4cc9f0',
  },
  {
    n: '②',
    title: '+ PEDIDO',
    desc: 'Haz clic en + PEDIDO, selecciona las pizzas y confirma.',
    hint: 'Puedes hacer varios pedidos seguidos.',
    color: '#4ade80',
  },
  {
    n: '③',
    title: 'Pipeline',
    desc: 'Manager acepta → Chef cocina → Delivery entrega. Sigue el tracker arriba del visor.',
    hint: 'Los robots se mueven y la 🍕 avanza etapa a etapa.',
    color: '#fbbf24',
  },
  {
    n: '④',
    title: 'SPEED',
    desc: 'Usa 2x / 5x para acelerar la simulación y ver más pedidos.',
    hint: 'En 5x todo pasa muy rápido — bueno para probar.',
    color: '#f97316',
  },
  {
    n: '⑤',
    title: 'DASHBOARD',
    desc: 'Cambia a la pestaña DASHBOARD para ver métricas y ajustar configuración.',
    hint: '¿Pizzas gratis? Cambia el SLA de entrega en el panel de config.',
    color: '#e94560',
  },
]

export function HowToUse() {
  // Mostrar abierto en primera visita
  const [open, setOpen] = useState(() => !localStorage.getItem('pizza_help_seen'))

  const dismiss = () => {
    setOpen(false)
    localStorage.setItem('pizza_help_seen', '1')
  }

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Botón toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ver guía de uso"
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-dim)',
          padding: '3px 10px',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: '8px',
          fontFamily: 'inherit',
          letterSpacing: '0.5px',
        }}
      >
        {open ? '▼' : '▶'} ¿CÓMO USAR?
      </button>

      {/* Panel desplegable */}
      {open && (
        <div style={{
          marginTop: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '12px 14px',
        }}>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
          }}>
            {STEPS.map(s => (
              <div key={s.n} style={{
                minWidth: 150, flexShrink: 0,
                background: 'var(--bg-kitchen)',
                border: `1px solid ${s.color}44`,
                borderRadius: 4, padding: '8px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: s.color, fontSize: '13px' }}>{s.n}</span>
                  <span style={{ color: s.color, fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {s.title}
                  </span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '8px', lineHeight: 1.6, marginBottom: 4 }}>
                  {s.desc}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '7px', fontStyle: 'italic', lineHeight: 1.5 }}>
                  💡 {s.hint}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={dismiss}
              style={{
                background: 'var(--accent-green)', color: '#000',
                border: 'none', borderRadius: 4, padding: '4px 12px',
                cursor: 'pointer', fontSize: '8px', fontFamily: 'inherit',
              }}
            >
              ✓ OK, entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
