import { useCallback } from 'react'

// Sonidos generados con Web Audio API — sin archivos externos.
// Razón: evita dependencias de assets en desarrollo. En Fase 6 se reemplazarán
// por samples reales (MP3/OGG) cargados via Howler.js.
function createTone(frequency, duration, type = 'sine', volume = 0.15) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch (e) {
    // Web Audio puede fallar en algunos contextos — silenciar el error
  }
}

// Mapa de sonidos por EventType
const SOUNDS = {
  ORDER_CREATED:       () => createTone(880, 0.15, 'sine'),
  ORDER_ACCEPTED:      () => createTone(660, 0.2, 'square', 0.1),
  PIZZA_COOKING:       () => createTone(200, 0.3, 'sawtooth', 0.08),
  PIZZA_BAKED:         () => { createTone(523, 0.1); setTimeout(() => createTone(659, 0.15), 100) },
  PIZZA_PACKED:        () => createTone(440, 0.1, 'square', 0.08),
  DELIVERY_DISPATCHED: () => createTone(349, 0.25, 'triangle'),
  DELIVERED:           () => { createTone(523, 0.1); setTimeout(() => createTone(784, 0.2), 120) },
  PAYMENT_RECEIVED:    () => { createTone(659, 0.1); setTimeout(() => createTone(784, 0.1), 80); setTimeout(() => createTone(1047, 0.2), 160) },
  PAYMENT_FREE:        () => createTone(220, 0.5, 'sawtooth', 0.12),
  STATION_CLEANING:    () => createTone(300, 0.2, 'triangle', 0.08),
}

export function useSound() {
  const play = useCallback((eventType) => {
    const fn = SOUNDS[eventType]
    if (fn) fn()
  }, [])
  return { play }
}
