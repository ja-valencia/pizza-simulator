/**
 * Tests del pipeline de órdenes — verifica que el store Zustand
 * avanza correctamente a través de todas las etapas del pipeline
 * cuando llegan eventos WebSocket simulados.
 *
 * No requiere backend ni browser — opera directamente sobre el store.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useSimStore } from '../store/simStore'
import { WP } from '../components/SimViewer/waypoints'

// Helper: dispara un evento del pipeline directamente al store
// (simula lo que haría useWebSocket.handleEvent)
function dispatchEvent(type, payload = {}) {
  const store = useSimStore.getState()
  const orderId = payload.order_id || 'test-order-id-0001'

  switch (type) {
    case 'ORDER_CREATED':
      store.addOrder({
        id: orderId,
        items: payload.items || ['margarita'],
        status: 'PENDING',
        createdAt: 0,
        wallCreatedAt: new Date().toISOString(),
      })
      store.updateAgentAction('manager', { action: 'order_created', posX: WP.manager.phone })
      break
    case 'ORDER_ACCEPTED':
      store.updateOrderStatus(orderId, 'ACCEPTED')
      store.updateAgentAction('manager', { action: 'order_accepted', posX: WP.manager.idle })
      break
    case 'COMANDA_SENT':
      store.updateAgentAction('manager', { action: 'comanda_sent', posX: WP.manager.comanda_drop })
      store.updateAgentAction('chef', { action: 'comanda_read', posX: WP.chef.comanda_read })
      break
    case 'PIZZA_COOKING':
      store.updateOrderStatus(orderId, 'COOKING')
      store.updateAgentAction('chef', { action: 'cooking', cooking: true, posX: WP.chef.oven })
      break
    case 'PIZZA_BAKED':
      store.updateOrderStatus(orderId, 'BAKED')
      store.updateAgentAction('chef', { action: 'baked', cooking: false, posX: WP.chef.packing })
      break
    case 'PIZZA_PACKED':
      store.updateOrderStatus(orderId, 'PACKED')
      store.updateAgentAction('chef', { action: 'packed', posX: WP.chef.shelf })
      break
    case 'DELIVERY_DISPATCHED':
      store.updateOrderStatus(orderId, 'IN_DELIVERY')
      store.addDeliveryHouse(orderId)
      store.updateAgentAction('delivery', { action: 'moving', moving: true, posX: WP.delivery.pickup })
      break
    case 'DELIVERED':
      store.updateOrderStatus(orderId, 'DELIVERED')
      store.markHouseDelivered(orderId)
      store.updateAgentAction('delivery', { action: 'delivered', moving: false, posX: WP.delivery.house_0 })
      break
    case 'PAYMENT_RECEIVED':
      store.updateOrderStatus(orderId, 'PAID')
      store.updateAgentAction('manager', { action: 'happy', posX: WP.manager.cash_register })
      store.closeOrder(orderId, false)
      break
    case 'PAYMENT_FREE':
      store.updateOrderStatus(orderId, 'FREE')
      store.updateAgentAction('manager', { action: 'shocked', posX: WP.manager.cash_register })
      store.closeOrder(orderId, true)
      break
    case 'DELIVERY_RETURNED':
      store.updateAgentAction('delivery', { action: 'returning', returning: true, posX: WP.delivery.home })
      setTimeout(() => store.clearDeliveredHouses(), 100)
      break
  }
}

const FULL_PIPELINE = [
  'ORDER_CREATED', 'ORDER_ACCEPTED', 'COMANDA_SENT',
  'PIZZA_COOKING', 'PIZZA_BAKED', 'PIZZA_PACKED',
  'DELIVERY_DISPATCHED', 'DELIVERED', 'PAYMENT_RECEIVED', 'DELIVERY_RETURNED',
]

const ORDER_ID = 'test-order-id-0001'

beforeEach(() => {
  // Reset store entre tests
  useSimStore.setState({
    orders: [],
    recentEvents: [],
    agentActions: {
      manager:  { action: 'idle', animKey: 0, posX: 50 },
      chef:     { action: 'idle', animKey: 0, posX: 32, cooking: false },
      delivery: { action: 'idle', animKey: 0, moving: false, returning: false, posX: 5 },
    },
    deliveryHouses: [],
    comandaFlying: false,
  })
})

describe('Pipeline completo ORDER_CREATED → PAID', () => {

  it('el pedido avanza por todos los estados hasta PAID', () => {
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID, items: ['margarita'] })
    expect(useSimStore.getState().orders[0].status).toBe('PENDING')

    dispatchEvent('ORDER_ACCEPTED', { order_id: ORDER_ID })
    expect(useSimStore.getState().orders[0].status).toBe('ACCEPTED')

    dispatchEvent('COMANDA_SENT', { order_id: ORDER_ID })
    dispatchEvent('PIZZA_COOKING', { order_id: ORDER_ID })
    expect(useSimStore.getState().orders[0].status).toBe('COOKING')

    dispatchEvent('PIZZA_BAKED', { order_id: ORDER_ID })
    expect(useSimStore.getState().orders[0].status).toBe('BAKED')

    dispatchEvent('PIZZA_PACKED', { order_id: ORDER_ID })
    expect(useSimStore.getState().orders[0].status).toBe('PACKED')

    dispatchEvent('DELIVERY_DISPATCHED', { order_id: ORDER_ID })
    expect(useSimStore.getState().orders[0].status).toBe('IN_DELIVERY')

    dispatchEvent('DELIVERED', { order_id: ORDER_ID })
    expect(useSimStore.getState().orders[0].status).toBe('DELIVERED')

    dispatchEvent('PAYMENT_RECEIVED', { order_id: ORDER_ID })
    expect(useSimStore.getState().orders[0].status).toBe('PAID')
  })

  it('PAYMENT_FREE marca el pedido con isFree=true', () => {
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID, items: ['pepperoni'] })
    dispatchEvent('ORDER_ACCEPTED', { order_id: ORDER_ID })
    dispatchEvent('PIZZA_COOKING', { order_id: ORDER_ID })
    dispatchEvent('PIZZA_PACKED', { order_id: ORDER_ID })
    dispatchEvent('DELIVERY_DISPATCHED', { order_id: ORDER_ID })
    dispatchEvent('DELIVERED', { order_id: ORDER_ID })
    dispatchEvent('PAYMENT_FREE', { order_id: ORDER_ID })

    const order = useSimStore.getState().orders[0]
    expect(order.status).toBe('FREE')
    expect(order.isFree).toBe(true)
    expect(order.wallDeliveredAt).toBeTruthy()
  })

  it('closeOrder guarda wallDeliveredAt cuando se paga', () => {
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID, items: ['hawaiana'] })
    dispatchEvent('PAYMENT_RECEIVED', { order_id: ORDER_ID })

    const order = useSimStore.getState().orders[0]
    expect(order.wallDeliveredAt).toBeTruthy()
    expect(order.isFree).toBe(false)
  })
})

describe('Posiciones de agentes (The Sims movement)', () => {

  it('Manager va al teléfono en ORDER_CREATED', () => {
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID })
    expect(useSimStore.getState().agentActions.manager.posX).toBe(WP.manager.phone)
    expect(useSimStore.getState().agentActions.manager.action).toBe('order_created')
  })

  it('Manager va a comanda_drop en COMANDA_SENT', () => {
    dispatchEvent('COMANDA_SENT', { order_id: ORDER_ID })
    expect(useSimStore.getState().agentActions.manager.posX).toBe(WP.manager.comanda_drop)
  })

  it('Chef va al horno en PIZZA_COOKING', () => {
    dispatchEvent('PIZZA_COOKING', { order_id: ORDER_ID })
    expect(useSimStore.getState().agentActions.chef.posX).toBe(WP.chef.oven)
    expect(useSimStore.getState().agentActions.chef.cooking).toBe(true)
  })

  it('Chef va al shelf en PIZZA_PACKED', () => {
    dispatchEvent('PIZZA_PACKED', { order_id: ORDER_ID })
    expect(useSimStore.getState().agentActions.chef.posX).toBe(WP.chef.shelf)
  })

  it('Delivery va a pickup en DELIVERY_DISPATCHED', () => {
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID })
    dispatchEvent('DELIVERY_DISPATCHED', { order_id: ORDER_ID })
    expect(useSimStore.getState().agentActions.delivery.posX).toBe(WP.delivery.pickup)
    expect(useSimStore.getState().agentActions.delivery.moving).toBe(true)
  })

  it('Manager va a cash_register en PAYMENT_RECEIVED', () => {
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID })
    dispatchEvent('PAYMENT_RECEIVED', { order_id: ORDER_ID })
    expect(useSimStore.getState().agentActions.manager.posX).toBe(WP.manager.cash_register)
    expect(useSimStore.getState().agentActions.manager.action).toBe('happy')
  })
})

describe('animKey incrementa en cada evento', () => {
  it('manager.animKey incrementa en cada updateAgentAction', () => {
    const initial = useSimStore.getState().agentActions.manager.animKey
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID })
    const after = useSimStore.getState().agentActions.manager.animKey
    expect(after).toBeGreaterThan(initial)
  })

  it('chef.animKey incrementa al cocinar', () => {
    const initial = useSimStore.getState().agentActions.chef.animKey
    dispatchEvent('PIZZA_COOKING', { order_id: ORDER_ID })
    expect(useSimStore.getState().agentActions.chef.animKey).toBeGreaterThan(initial)
  })
})

describe('Casas de delivery', () => {
  it('se crea una casa en DELIVERY_DISPATCHED y se marca en DELIVERED', () => {
    dispatchEvent('ORDER_CREATED', { order_id: ORDER_ID })
    dispatchEvent('DELIVERY_DISPATCHED', { order_id: ORDER_ID })
    expect(useSimStore.getState().deliveryHouses).toHaveLength(1)
    expect(useSimStore.getState().deliveryHouses[0].delivered).toBe(false)

    dispatchEvent('DELIVERED', { order_id: ORDER_ID })
    expect(useSimStore.getState().deliveryHouses[0].delivered).toBe(true)
  })
})
