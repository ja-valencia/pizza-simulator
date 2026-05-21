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
}))
