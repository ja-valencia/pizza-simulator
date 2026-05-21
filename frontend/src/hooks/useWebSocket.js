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
      // /ws → proxied por Vite a ws://localhost:8000/ws
      const ws = new WebSocket(`ws://${window.location.host}/ws`)
      wsRef.current = ws

      ws.onmessage = (e) => {
        const event = JSON.parse(e.data)
        handleEvent(event)
      }

      ws.onclose = () => {
        // Reconexión automática cada 3s si el backend se cae o reinicia
        setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    }

    function handleEvent(event) {
      const { type, payload, agent, sim_time } = event

      // Reloj de simulación
      if (type === 'CLOCK_TICK') {
        updateClock(payload)
        return
      }

      // Cambio de config (velocidad, reglas)
      if (type === 'CONFIG_UPDATED') {
        return
      }

      // Estado inicial al conectar
      if (type === 'CONNECTED') {
        return
      }

      // Eventos de negocio → actualizar agente + log
      const agentName = agent || EVENT_AGENT_MAP[type]
      if (agentName) {
        updateAgent(agentName, {
          status: EVENT_STATUS_MAP[type] || type,
          message: payload?.message || '',
          cooking: type === 'PIZZA_COOKING',
          inTransit: type === 'DELIVERY_DISPATCHED',
        })
      }

      // Agregar al feed de eventos
      addEvent({ type, payload, agent: agentName, sim_time, id: Date.now() })

      // Sincronizar estado de pedidos
      if (type === 'ORDER_CREATED' && payload?.order_id) {
        addOrder({ id: payload.order_id, items: payload.items, status: 'PENDING' })
      }
      if (payload?.order_id && EVENT_STATUS_MAP[type]) {
        const statusMap = {
          ORDER_ACCEPTED: 'ACCEPTED', PIZZA_COOKING: 'COOKING',
          PIZZA_BAKED: 'BAKED', PIZZA_PACKED: 'PACKED',
          DELIVERY_DISPATCHED: 'IN_DELIVERY', DELIVERED: 'DELIVERED',
          PAYMENT_RECEIVED: 'PAID', PAYMENT_FREE: 'FREE',
        }
        if (statusMap[type]) updateOrderStatus(payload.order_id, statusMap[type])
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [])
}
