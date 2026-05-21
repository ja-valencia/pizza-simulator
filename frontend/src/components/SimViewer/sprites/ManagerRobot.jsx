// ManagerRobot — Robot italiano estilo 8-bit con aspecto de manager de pizzería.
// Diseño SVG puro: sin imágenes externas, escalable, animable con Framer Motion.
// Colores: azul corporativo + gris + cyan para los "ojos LED".
// Props: size (px), action ('idle'|'calling'|'happy'|'shocked'), animated (bool)

export function ManagerRobot({ size = 80, action = 'idle', animated = false }) {
  const s = size / 80  // factor de escala

  const eyeColor = action === 'shocked' ? '#ef4444' : action === 'happy' ? '#4ade80' : '#4cc9f0'
  const bodyColor = '#1e3a5f'
  const screenColor = action === 'calling' ? '#22d3ee' : '#0f172a'
  const accentColor = '#4cc9f0'

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 80 92"
      style={{ imageRendering: 'pixelated', overflow: 'visible' }}
    >
      {/* Antena */}
      <rect x="37" y="0" width="6" height="10" fill={accentColor} />
      <rect x="34" y="0" width="12" height="4" fill={accentColor} />

      {/* Cabeza */}
      <rect x="22" y="10" width="36" height="28" fill={bodyColor} />
      {/* Borde cabeza */}
      <rect x="20" y="12" width="4" height="24" fill="#2d5080" />
      <rect x="56" y="12" width="4" height="24" fill="#2d5080" />
      <rect x="22" y="8" width="36" height="4" fill="#2d5080" />

      {/* Ojos LED */}
      <rect x="28" y="18" width="10" height="8" fill={eyeColor} rx="1" />
      <rect x="42" y="18" width="10" height="8" fill={eyeColor} rx="1" />
      {/* Brillo en ojos */}
      <rect x="30" y="19" width="3" height="3" fill="white" opacity="0.6" />
      <rect x="44" y="19" width="3" height="3" fill="white" opacity="0.6" />

      {/* Boca (línea recta seria) */}
      <rect x="30" y="30" width="20" height="3" fill={accentColor} />

      {/* Cuello */}
      <rect x="34" y="38" width="12" height="6" fill="#2d5080" />

      {/* Cuerpo */}
      <rect x="18" y="44" width="44" height="30" fill={bodyColor} />
      {/* Pantalla/tablet en el pecho */}
      <rect x="26" y="48" width="28" height="18" fill={screenColor} rx="2" />
      <rect x="28" y="50" width="24" height="14" fill={action === 'calling' ? '#0e7490' : '#1e293b'} rx="1" />
      {/* Líneas de texto en pantalla */}
      <rect x="30" y="53" width="16" height="2" fill={accentColor} opacity="0.8" />
      <rect x="30" y="57" width="12" height="2" fill={accentColor} opacity="0.6" />
      <rect x="30" y="61" width="18" height="2" fill={accentColor} opacity="0.4" />

      {/* Corbata italiana */}
      <rect x="37" y="44" width="6" height="12" fill="#e94560" />
      <rect x="36" y="56" width="8" height="6" fill="#c41340" />

      {/* Brazo izquierdo — sostiene clipboard */}
      <rect x="4" y="46" width="14" height="8" fill={bodyColor} />
      <rect x="0" y="50" width="14" height="8" fill={bodyColor} />
      {/* Clipboard */}
      <rect x="0" y="46" width="10" height="14" fill="#fbbf24" rx="1" />
      <rect x="2" y="49" width="6" height="2" fill="#78350f" />
      <rect x="2" y="53" width="6" height="1" fill="#78350f" opacity="0.7" />
      <rect x="2" y="55" width="4" height="1" fill="#78350f" opacity="0.5" />

      {/* Brazo derecho */}
      <rect x="62" y="46" width="14" height="8" fill={bodyColor} />
      <rect x="66" y="50" width="12" height="8" fill={bodyColor} />
      {/* Mano */}
      <rect x="72" y="54" width="6" height="6" fill="#2d5080" />

      {/* Piernas */}
      <rect x="24" y="74" width="12" height="14" fill="#2d5080" />
      <rect x="44" y="74" width="12" height="14" fill="#2d5080" />
      {/* Pies */}
      <rect x="22" y="84" width="16" height="6" fill={bodyColor} />
      <rect x="42" y="84" width="16" height="6" fill={bodyColor} />
    </svg>
  )
}
