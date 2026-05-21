// Capa de acceso al backend FastAPI.
// Usa /api/* que Vite proxea a http://localhost:8000/* en desarrollo.
// En producción apuntaría directamente al backend URL via variable de entorno.

const BASE = '/api'

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  // Control de simulación
  simStart:  () => request('POST', '/sim/start'),
  simStop:   () => request('POST', '/sim/stop'),
  simReset:  () => request('POST', '/sim/reset'),
  simStatus: () => request('GET',  '/sim/status'),

  // Configuración — actualiza reglas de negocio en caliente
  getConfig:    () => request('GET',  '/config'),
  updateConfig: (cfg) => request('PUT', '/config', cfg),

  // Pedidos
  createOrder: (items) => request('POST', '/orders', { items }),
  listOrders:  () => request('GET', '/orders'),

  // Analytics — Fase 5
  // summary: métricas agregadas desde PostgreSQL (polling cada 5s en Dashboard)
  getAnalyticsSummary: () => request('GET', '/analytics/summary'),
  // timeline: órdenes completadas por ventana de sim_time (para LineChart)
  getTimeline:         () => request('GET', '/analytics/timeline'),
  // ordersByStatus: distribución de status (para PieChart)
  getOrdersByStatus:   () => request('GET', '/analytics/orders-by-status'),
}
