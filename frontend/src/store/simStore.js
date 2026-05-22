import { create } from 'zustand'
import { HOUSE_POSITIONS } from '../components/SimViewer/waypoints'

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

  // Marca el pedido como finalizado guardando wallDeliveredAt y isFree
  closeOrder: (orderId, isFree) => set((state) => ({
    orders: state.orders.map(o =>
      o.id === orderId
        ? { ...o, wallDeliveredAt: new Date().toISOString(), isFree }
        : o
    ),
  })),

  // Métricas del Dashboard
  metrics: {
    total_orders: 0, completed: 0, in_progress: 0,
    free_deliveries: 0, avg_delivery_sim_seconds: 0, on_time_rate: 1.0,
  },
  updateMetrics: (metrics) => set({ metrics }),

  // Config actual — sincronizada al conectar y en CONFIG_UPDATED
  config: null,
  setConfig: (config) => set({ config }),

  // Estado de posición y acción de cada agente para el pipeline visual.
  // posX: posición horizontal en % dentro de la zona del agente.
  // Fase 7: todos los agentes tienen posX para movimiento estilo The Sims.
  agentActions: {
    manager:  { action: 'idle', animKey: 0, posX: 50 },
    chef:     { action: 'idle', animKey: 0, posX: 32, cooking: false },
    delivery: { action: 'idle', animKey: 0, moving: false, returning: false, posX: 5 },
  },

  // Casas activas en la zona de delivery.
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
    const idx = state.deliveryHouses.length
    // posX sincronizado con HOUSE_POSITIONS para que el robot llegue al lugar exacto
    const posX = HOUSE_POSITIONS[Math.min(idx, HOUSE_POSITIONS.length - 1)]
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

  // Unidad de tiempo preferida para mostrar el reloj.
  // Fase 7: toggle en SimPanel, persiste en localStorage.
  timeUnit: localStorage.getItem('pizza_time_unit') || 'sec',
  setTimeUnit: (unit) => {
    localStorage.setItem('pizza_time_unit', unit)
    set({ timeUnit: unit })
  },
}))
