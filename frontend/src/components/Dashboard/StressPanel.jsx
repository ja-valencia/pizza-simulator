import { api } from '../../services/api'

// StressPanel: escenarios preset de estrés para probar el simulador.
// Cada botón combina múltiples acciones (crear pedidos + cambiar config)
// para simular situaciones extremas con un solo clic.

const BUTTON_STYLE = (color = 'var(--accent-red)') => ({
  background: 'var(--bg-kitchen)',
  border: `1px solid ${color}`,
  color,
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '9px',
  fontFamily: 'inherit',
  width: '100%',
  textAlign: 'left',
  marginBottom: '6px',
})

const PIZZA_MENU = ['margarita', 'pepperoni', 'hawaiana', 'cuatro quesos', 'vegetariana']

function randomItems() {
  const n = Math.floor(Math.random() * 2) + 1
  return Array.from({ length: n }, () => PIZZA_MENU[Math.floor(Math.random() * PIZZA_MENU.length)])
}

export function StressPanel() {
  const handleRushHour = async () => {
    // Crea 5 pedidos simultáneos — simula una hora pico
    // Razón: prueba si el sistema puede manejar concurrencia sin deadlocks
    try {
      await Promise.all(
        Array.from({ length: 5 }, () => api.createOrder(randomItems()))
      )
    } catch (e) { console.error(e) }
  }

  const handleSlowDelivery = async () => {
    // SLA muy agresivo: gratis si tarda más de 2 minutos de simulación
    // Razón: fuerza al sistema a generar PAYMENT_FREE y prueba la lógica de SLA
    try {
      const cfg = await api.getConfig()
      await api.updateConfig({ ...cfg, free_delivery_after_minutes: 2 })
    } catch (e) { console.error(e) }
  }

  const handleDirtyKitchen = async () => {
    // Chef limpia estación cada pizza — máximas interrupciones
    // Razón: prueba la resiliencia cuando el Chef está constantemente ocupado limpiando
    try {
      const cfg = await api.getConfig()
      await api.updateConfig({ ...cfg, station_clean_every_n_pizzas: 1 })
    } catch (e) { console.error(e) }
  }

  const handleResetConfig = async () => {
    // Restaura todos los defaults de SimConfig
    try {
      await api.updateConfig({
        max_delivery_capacity: 5,
        station_clean_every_n_pizzas: 10,
        station_clean_every_minutes: 30.0,
        chef_batch_wait_seconds: 30.0,
        free_delivery_after_minutes: 45.0,
        sim_speed_multiplier: 1.0,
        auto_order_enabled: false,
        auto_order_interval_seconds: 10.0,
      })
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '2px', marginBottom: '10px' }}>
        ── STRESS TESTING ──
      </div>

      <button style={BUTTON_STYLE('var(--accent-red)')} onClick={handleRushHour}>
        🚀 RUSH HOUR ×5
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginTop: '2px' }}>
          Crea 5 pedidos simultáneos
        </div>
      </button>

      <button style={BUTTON_STYLE('var(--accent-yellow)')} onClick={handleSlowDelivery}>
        🐢 SLOW DELIVERY
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginTop: '2px' }}>
          SLA = 2 min → casi todo gratis
        </div>
      </button>

      <button style={BUTTON_STYLE('#a78bfa')} onClick={handleDirtyKitchen}>
        🍕 DIRTY KITCHEN
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginTop: '2px' }}>
          Limpieza cada pizza → Chef ocupado
        </div>
      </button>

      <button style={BUTTON_STYLE('var(--text-dim)')} onClick={handleResetConfig}>
        🔄 RESET CONFIG
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginTop: '2px' }}>
          Restaura defaults
        </div>
      </button>
    </div>
  )
}
