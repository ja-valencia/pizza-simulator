import { useEffect, useRef } from 'react'
import { useSimStore } from '../store/simStore'
import { WP, HOUSE_POSITIONS } from '../components/SimViewer/waypoints'

// Mapa EventType → agente responsable.
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
  ORDER_FAILED: 'manager',
}

// Status visual por evento
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
  ORDER_FAILED: 'Pedido cancelado ❌',
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

      // ── Fase 7: acciones visuales del pipeline con posX (movimiento estilo The Sims) ──
      switch (type) {

        // MANAGER: teléfono → escritorio → comanda → caja
        case 'ORDER_CREATED':
          store.updateAgentAction('manager', { action: 'order_created', posX: WP.manager.phone })
          break

        case 'ORDER_ACCEPTED':
          store.updateAgentAction('manager', { action: 'order_accepted', posX: WP.manager.idle })
          break

        case 'COMANDA_SENT':
          store.updateAgentAction('manager', { action: 'comanda_sent', posX: WP.manager.comanda_drop })
          store.setComandaFlying(true)
          setTimeout(() => store.setComandaFlying(false), 1200)
          // Manager vuelve al escritorio después de dejar la comanda
          setTimeout(() => store.updateAgentAction('manager', { action: 'idle', posX: WP.manager.idle }), 1800)
          // Chef va a leer la comanda
          store.updateAgentAction('chef', { action: 'comanda_read', posX: WP.chef.comanda_read })
          break

        // CHEF: leer comanda → horno → empacar → barra entrega
        case 'PIZZA_COOKING':
          store.updateAgentAction('chef', { action: 'cooking', cooking: true, posX: WP.chef.oven })
          break

        case 'PIZZA_BAKED':
          store.updateAgentAction('chef', { action: 'baked', cooking: false, posX: WP.chef.packing })
          break

        case 'PIZZA_PACKED':
          store.updateAgentAction('chef', { action: 'packed', cooking: false, posX: WP.chef.shelf })
          // Chef regresa al centro después de dejar la caja
          setTimeout(() => store.updateAgentAction('chef', { action: 'idle', posX: WP.chef.idle }), 1400)
          break

        case 'STATION_CLEANING':
          store.updateAgentAction('chef', { action: 'cleaning', cooking: false, posX: WP.chef.idle })
          break

        // DELIVERY: recoge → va a las casas → regresa
        case 'DELIVERY_DISPATCHED': {
          // Primero ir a recoger, luego moverse a la primera casa
          store.updateAgentAction('delivery', { action: 'moving', moving: true, returning: false, posX: WP.delivery.pickup })
          if (payload?.order_id) store.addDeliveryHouse(payload.order_id)
          // Después de recoger, avanzar hacia la casa de entrega
          setTimeout(() => {
            const { deliveryHouses } = useSimStore.getState()
            const houseIdx = Math.min(deliveryHouses.length - 1, HOUSE_POSITIONS.length - 1)
            const targetX = HOUSE_POSITIONS[Math.max(0, houseIdx)]
            store.updateAgentAction('delivery', { posX: targetX })
          }, 700)
          break
        }

        case 'DELIVERED': {
          if (payload?.order_id) {
            const { deliveryHouses } = useSimStore.getState()
            const house = deliveryHouses.find(h => h.orderId === payload.order_id)
            store.markHouseDelivered(payload.order_id)
            store.updateAgentAction('delivery', { action: 'delivered', moving: false, posX: house?.posX ?? 30 })
          }
          break
        }

        case 'DELIVERY_RETURNED':
          store.updateAgentAction('delivery', { action: 'returning', moving: false, returning: true, posX: WP.delivery.home })
          setTimeout(() => {
            store.updateAgentAction('delivery', { action: 'idle', returning: false, posX: WP.delivery.home })
            store.clearDeliveredHouses()
          }, 2200)
          break

        // MANAGER: pago → caja → escritorio
        case 'PAYMENT_RECEIVED':
          store.updateAgentAction('manager', { action: 'happy', posX: WP.manager.cash_register })
          if (payload?.order_id) store.closeOrder(payload.order_id, false)
          setTimeout(() => store.updateAgentAction('manager', { action: 'idle', posX: WP.manager.idle }), 1800)
          break

        case 'PAYMENT_FREE':
          store.updateAgentAction('manager', { action: 'shocked', posX: WP.manager.cash_register })
          if (payload?.order_id) store.closeOrder(payload.order_id, true)
          setTimeout(() => store.updateAgentAction('manager', { action: 'idle', posX: WP.manager.idle }), 2200)
          break

        case 'ORDER_FAILED':
          // Limpiar estado visual: cajas del shelf, casas pendientes, agentes a idle
          if (payload?.order_id) {
            updateOrderStatus(payload.order_id, 'FAILED')
          }
          store.clearDeliveredHouses()
          // Devolver agentes a idle si estaban ocupados con este pedido
          store.updateAgentAction('manager',  { action: 'idle', posX: WP.manager.idle })
          store.updateAgentAction('chef',     { action: 'idle', posX: WP.chef.idle, cooking: false })
          store.updateAgentAction('delivery', { action: 'idle', moving: false, returning: false, posX: WP.delivery.home })
          break
      }

      addEvent({ type, payload, agent: agentName, sim_time, id: Date.now() })

      if (type === 'ORDER_CREATED' && payload?.order_id) {
        addOrder({
          id: payload.order_id,
          items: payload.items,
          status: 'PENDING',
          createdAt: sim_time,
          wallCreatedAt: new Date().toISOString(),
        })
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
