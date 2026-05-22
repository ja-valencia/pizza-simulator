/**
 * Tests de resiliencia — verifica que el store no crashea con
 * eventos fuera de orden, duplicados, o con IDs desconocidos.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useSimStore } from '../store/simStore'
import { WP, HOUSE_POSITIONS } from '../components/SimViewer/waypoints'

beforeEach(() => {
  useSimStore.setState({
    orders: [],
    agentActions: {
      manager:  { action: 'idle', animKey: 0, posX: 50 },
      chef:     { action: 'idle', animKey: 0, posX: 32, cooking: false },
      delivery: { action: 'idle', animKey: 0, moving: false, returning: false, posX: 5 },
    },
    deliveryHouses: [],
  })
})

describe('Eventos fuera de orden no crashean', () => {

  it('DELIVERED sin DELIVERY_DISPATCHED previo no crashea', () => {
    const store = useSimStore.getState()
    expect(() => {
      store.markHouseDelivered('unknown-order-id')
      store.updateAgentAction('delivery', { action: 'delivered', moving: false })
    }).not.toThrow()
  })

  it('PAYMENT sin order en el store no crashea', () => {
    const store = useSimStore.getState()
    expect(() => {
      store.updateOrderStatus('ghost-id', 'PAID')
      store.closeOrder('ghost-id', false)
    }).not.toThrow()
  })

  it('Múltiples addDeliveryHouse con el mismo orderId no duplica casas', () => {
    const store = useSimStore.getState()
    store.addDeliveryHouse('dup-order')
    store.addDeliveryHouse('dup-order')
    store.addDeliveryHouse('dup-order')
    expect(useSimStore.getState().deliveryHouses).toHaveLength(1)
  })

  it('clearDeliveredHouses no crashea si no hay casas entregadas', () => {
    const store = useSimStore.getState()
    store.addDeliveryHouse('order-1')
    expect(() => store.clearDeliveredHouses()).not.toThrow()
    // La casa no estaba marcada como delivered, así que sigue ahí
    expect(useSimStore.getState().deliveryHouses).toHaveLength(1)
  })
})

describe('posX nunca queda en undefined', () => {
  const EVENT_ACTIONS = [
    ['manager', { action: 'order_created', posX: WP.manager.phone }],
    ['manager', { action: 'comanda_sent',  posX: WP.manager.comanda_drop }],
    ['manager', { action: 'happy',         posX: WP.manager.cash_register }],
    ['manager', { action: 'shocked',       posX: WP.manager.cash_register }],
    ['manager', { action: 'idle',          posX: WP.manager.idle }],
    ['chef',    { action: 'cooking', cooking: true,  posX: WP.chef.oven }],
    ['chef',    { action: 'baked',   cooking: false, posX: WP.chef.packing }],
    ['chef',    { action: 'packed',  cooking: false, posX: WP.chef.shelf }],
    ['chef',    { action: 'idle',                    posX: WP.chef.idle }],
    ['delivery',{ action: 'moving',    moving: true,  returning: false, posX: WP.delivery.pickup }],
    ['delivery',{ action: 'delivered', moving: false,                   posX: WP.delivery.house_0 }],
    ['delivery',{ action: 'returning', moving: false, returning: true,  posX: WP.delivery.home }],
    ['delivery',{ action: 'idle',      moving: false, returning: false, posX: WP.delivery.home }],
  ]

  it.each(EVENT_ACTIONS)('agentActions.%s con action=%s.action tiene posX numérico', (agent, update) => {
    const store = useSimStore.getState()
    store.updateAgentAction(agent, update)
    const posX = useSimStore.getState().agentActions[agent].posX
    expect(typeof posX).toBe('number')
    expect(posX).not.toBeNaN()
    expect(posX).toBeGreaterThanOrEqual(0)
    expect(posX).toBeLessThanOrEqual(100)
  })
})

describe('HOUSE_POSITIONS sincronizadas con waypoints', () => {
  it('addDeliveryHouse usa HOUSE_POSITIONS como posX', () => {
    const store = useSimStore.getState()
    store.addDeliveryHouse('h1')
    store.addDeliveryHouse('h2')
    store.addDeliveryHouse('h3')
    const houses = useSimStore.getState().deliveryHouses
    expect(houses[0].posX).toBe(HOUSE_POSITIONS[0])
    expect(houses[1].posX).toBe(HOUSE_POSITIONS[1])
    expect(houses[2].posX).toBe(HOUSE_POSITIONS[2])
  })

  it('WP.delivery.house_N coincide con HOUSE_POSITIONS[N]', () => {
    expect(WP.delivery.house_0).toBe(HOUSE_POSITIONS[0])
    expect(WP.delivery.house_1).toBe(HOUSE_POSITIONS[1])
    expect(WP.delivery.house_2).toBe(HOUSE_POSITIONS[2])
  })
})
