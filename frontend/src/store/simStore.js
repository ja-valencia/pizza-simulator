import { create } from 'zustand'

// Zustand: store global del simulador.
// Razón de usar Zustand sobre Redux/Context: API mínima, sin boilerplate,
// y las actualizaciones son granulares — solo re-renderiza lo que cambió.
// Ideal para updates frecuentes de WebSocket (CLOCK_TICK cada 0.5s).
export const useSimStore = create((set) => ({
  // Estado del reloj
  simTime: 0,
  isRunning: false,
  speed: 1.0,

  // Pedidos activos (últimos 20 para no saturar la UI)
  orders: [],

  // Feed de eventos para el EventLog (últimos 15)
  recentEvents: [],

  // Estado de cada agente — incluye animación trigger para Framer Motion
  agentStates: {
    manager:  { status: 'idle', message: '', animKey: 0 },
    chef:     { status: 'idle', message: '', animKey: 0, cooking: false },
    delivery: { status: 'idle', message: '', animKey: 0, inTransit: false },
    cliente:  { status: 'idle', message: '', animKey: 0 },
  },

  // Acciones
  updateClock: (payload) => set({
    simTime: payload.sim_time,
    isRunning: payload.running,
    speed: payload.speed,
  }),

  addEvent: (event) => set((state) => ({
    recentEvents: [event, ...state.recentEvents].slice(0, 15),
  })),

  updateAgent: (agentName, update) => set((state) => ({
    agentStates: {
      ...state.agentStates,
      [agentName]: {
        ...state.agentStates[agentName],
        ...update,
        // animKey cambia con cada update → Framer Motion re-dispara la animación
        animKey: (state.agentStates[agentName]?.animKey || 0) + 1,
      },
    },
  })),

  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders].slice(0, 20),
  })),

  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o),
  })),

  // Métricas del Dashboard — actualizadas por polling (useAnalytics) y WebSocket
  metrics: {
    total_orders: 0,
    completed: 0,
    in_progress: 0,
    free_deliveries: 0,
    avg_delivery_sim_seconds: 0,
    on_time_rate: 1.0,
  },
  updateMetrics: (metrics) => set({ metrics }),

  // Config actual de la simulación — se sincroniza al conectar y en CONFIG_UPDATED
  config: null,
  setConfig: (config) => set({ config }),

  // Estado de posición y acción de cada agente para el pipeline visual.
  // Fase 6: permite animar movimiento entre zonas y acciones específicas.
  agentActions: {
    manager:  { action: 'idle', animKey: 0 },
    chef:     { action: 'idle', animKey: 0, cooking: false },
    delivery: { action: 'idle', animKey: 0, moving: false, returning: false, posX: 0 },
  },

  // Casas activas en la zona de delivery.
  // Se generan cuando un pedido entra en IN_DELIVERY y desaparecen con PAID/FREE.
  deliveryHouses: [],  // [{ orderId, delivered, posX }]

  // Comanda volando de Manager → Chef (overlay animado)
  comandaFlying: false,

  updateAgentAction: (agentName, update) => set((state) => ({
    agentActions: {
      ...state.agentActions,
      [agentName]: {
        ...state.agentActions[agentName],
        ...update,
        animKey: (state.agentActions[agentName]?.animKey || 0) + 1,
      },
    },
  })),

  addDeliveryHouse: (orderId) => set((state) => {
    if (state.deliveryHouses.find(h => h.orderId === orderId)) return state
    // Distribuir casas uniformemente en la zona de delivery (50% del container)
    const existing = state.deliveryHouses.length
    const posX = 10 + existing * 28  // % relativo a la zona delivery
    return { deliveryHouses: [...state.deliveryHouses, { orderId, delivered: false, posX }] }
  }),

  markHouseDelivered: (orderId) => set((state) => ({
    deliveryHouses: state.deliveryHouses.map(h =>
      h.orderId === orderId ? { ...h, delivered: true } : h
    ),
  })),

  clearDeliveredHouses: () => set((state) => ({
    deliveryHouses: state.deliveryHouses.filter(h => !h.delivered),
  })),

  setComandaFlying: (flying) => set({ comandaFlying: flying }),
}))
