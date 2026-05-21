import { useCallback } from 'react'

// Síntesis de audio chiptune — estilo videojuego 8-bit usando Web Audio API.
// Howler.js (instalado) se usará en el futuro para samples reales MP3/OGG.
// Por ahora: síntesis programática que suena a Game Boy / NES.

function getCtx() {
  if (!window._audioCtx) {
    window._audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return window._audioCtx
}

// Nota simple con envolvente ADSR básica
function note(freq, duration, type = 'square', vol = 0.12, delay = 0) {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.01)
    gain.gain.setValueAtTime(vol, t + duration * 0.7)
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
    osc.start(t)
    osc.stop(t + duration)
  } catch (e) {}
}

// Arpegio — notas en secuencia rápida, estilo 8-bit
function arpeggio(freqs, noteDur = 0.08, type = 'square', vol = 0.1) {
  freqs.forEach((f, i) => note(f, noteDur, type, vol, i * noteDur))
}

// Fanfare — melodía corta de victoria
function fanfare() {
  arpeggio([523, 659, 784, 1047], 0.1, 'square', 0.12)
}

// Sonido de derrota / pizzas gratis
function defeat() {
  arpeggio([523, 466, 415, 349, 294], 0.12, 'sawtooth', 0.1)
}

// Motor de delivery (ruido de motor 8-bit)
function motorSound() {
  note(80,  0.15, 'sawtooth', 0.08)
  note(100, 0.15, 'sawtooth', 0.08, 0.15)
  note(80,  0.15, 'sawtooth', 0.08, 0.30)
}

// Mapa de sonidos por EventType
const SOUNDS = {
  ORDER_CREATED:        () => note(880, 0.12, 'square', 0.1),
  ORDER_ACCEPTED:       () => arpeggio([660, 784], 0.1),
  COMANDA_SENT:         () => note(523, 0.15, 'square', 0.08),
  PIZZA_COOKING:        () => note(220, 0.2, 'sawtooth', 0.07),
  PIZZA_BAKED:          () => arpeggio([523, 659, 784], 0.09, 'square', 0.12),
  PIZZA_PACKED:         () => note(440, 0.1, 'square', 0.08),
  DELIVERY_DISPATCHED:  () => motorSound(),
  DELIVERED:            () => arpeggio([659, 784, 1047], 0.09),
  PAYMENT_RECEIVED:     () => fanfare(),
  PAYMENT_FREE:         () => defeat(),
  STATION_CLEANING:     () => { note(300, 0.1, 'triangle', 0.06); note(250, 0.1, 'triangle', 0.06, 0.15) },
  CLOCK_TICK:           null, // sin sonido en cada tick
}

export function useSound() {
  const play = useCallback((eventType) => {
    const fn = SOUNDS[eventType]
    if (fn) fn()
  }, [])
  return { play }
}
