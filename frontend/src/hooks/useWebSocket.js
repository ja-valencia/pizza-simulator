import { useEffect, useRef } from 'react'
import { useSimStore } from '../store/simStore'

// Mapa EventType → agente responsable.
// Permite actualizar el estado visual del agente correcto por cada evento del backend.
const EVENT_AGENT_MAP = {
  ORDER_CREATED: 'cliente',
  ORDER_ACCEPTED: 'manager',
  COMANDA_SENT: 'manager',
  PIZZA_COOKING: 'chef',
  PIZZA_BAKED: 'chef',
  PIZZA_PACKED: 'chef',
  STATION_CLEANING: 'chef',
  DELIVERY_DISPATCHED: 'delivery',
  DELIVERED: 'delivery',
  PAYMENT_RECEIVED: 'manager',
  PAYMENT_FREE: 'manager',
  DELIVERY_RETURNED: 'delivery',
}

// Status visual por evento — se muestra en la card del agente y EventLog
const EVENT_STATUS_MAP = {
  ORDER_CREATED: 'Recibiendo pedido...',
  ORDER_ACCEPTED: 'Aceptando pedido',
  COMANDA_SENT: 'Enviando comanda',
  PIZZA_COOKING: 'Horneando 🔥',
  PIZZA_BAKED: 'Pizza lista ✓',
  PIZZA_PACKED: 'Empacando 📦',
  STATION_CLEANING: 'Limpiando estación 🧹',
  DELIVERY_DISPATCHED: 'Saliendo a entregar 🛵',
  DELIVERED: 'Entregado ✓',
  PAYMENT_RECEIVED: 'Pago recibido 💰',
  PAYMENT_FREE: '¡GRATIS! 🚨',
  DELIVERY_RETURNED: 'Regresando...',
}

export function useWebSocket() {
  const wsRef = useRef(null)
  const { updateClock, addEvent, updateAgent, addOrder, updateOrderStatus } = useSimStore()

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(`ws://${window.location.host}/ws`)
      wsRef.current = ws
      ws.onmessage = (e) => handleEvent(JSON.parse(e.data))
      ws.onclose = () => setTimeout(connect, 3000)
      ws.onerror = () => ws.close()
    }

    function handleEvent(event) {
      const { type, payload, agent, sim_time } = event
      const store = useSimStore.getState()

      if (type === 'CLOCK_TICK') { updateClock(payload); return }
      if (type === 'CONFIG_UPDATED') { store.setConfig(payload); return }
      if (type === 'CONNECTED')     { store.setConfig(payload); return }

      // Actualizar agente (legacy — para EventLog y agentStates)
      const agentName = agent || EVENT_AGENT_MAP[type]
      if (agentName) {
        updateAgent(agentName, {
          status: EVENT_STATUS_MAP[type] || type,
          message: payload?.message || '',
          cooking: type === 'PIZZA_COOKING',
          inTransit: type === 'DELIVERY_DISPATCHED',
        })
      }

      // Fase 6: acciones visuales del pipeline
      switch (type) {
        case 'ORDER_CREATED':
        case 'ORDER_ACCEPTED':
          store.updateAgentAction('manager', { action: type.toLowerCase() })
          break
        case 'COMANDA_SENT':
          store.updateAgentAction('manager', { action: 'comanda_sent' })
          store.setComandaFlying(true)
          setTimeout(() => store.setComandaFlying(false), 1200)
          break
        case 'PIZZA_COOKING':
          store.updateAgentAction('chef', { action: 'cooking', cooking: true })
          break
        case 'PIZZA_BAKED':
          store.updateAgentAction('chef', { action: 'baked', cooking: false })
          break
        case 'PIZZA_PACKED':
          store.updateAgentAction('chef', { action: 'packed', cooking: false })
          break
        case 'STATION_CLEANING':
          store.updateAgentAction('chef', { action: 'cleaning', cooking: false })
          break
        case 'DELIVERY_DISPATCHED':
          store.updateAgentAction('delivery', { action: 'moving', moving: true, returning: false })
          if (payload?.order_id) store.addDeliveryHouse(payload.order_id)
          break
        case 'DELIVERED':
          if (payload?.order_id) store.markHouseDelivered(payload.order_id)
          store.updateAgentAction('delivery', { action: 'delivered', moving: false })
          break
        case 'DELIVERY_RETURNED':
          store.updateAgentAction('delivery', { action: 'returning', moving: false, returning: true })
          setTimeout(() => {
            store.updateAgentAction('delivery', { action: 'idle', returning: false })
            store.clearDeliveredHouses()
          }, 2000)
          break
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_FREE':
          store.updateAgentAction('manager', { action: type === 'PAYMENT_FREE' ? 'shocked' : 'happy' })
          break
      }

      addEvent({ type, payload, agent: agentName, sim_time, id: Date.now() })

      if (type === 'ORDER_CREATED' && payload?.order_id) {
        addOrder({ id: payload.order_id, items: payload.items, status: 'PENDING', createdAt: sim_time })
      }
      const statusMap = {
        ORDER_ACCEPTED: 'ACCEPTED', PIZZA_COOKING: 'COOKING',
        PIZZA_BAKED: 'BAKED', PIZZA_PACKED: 'PACKED',
        DELIVERY_DISPATCHED: 'IN_DELIVERY', DELIVERED: 'DELIVERED',
        PAYMENT_RECEIVED: 'PAID', PAYMENT_FREE: 'FREE',
      }
      if (payload?.order_id && statusMap[type]) {
        updateOrderStatus(payload.order_id, statusMap[type])
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [])
}
