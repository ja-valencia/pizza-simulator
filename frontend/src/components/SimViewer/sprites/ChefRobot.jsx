// ChefRobot — Pizzero italiano robot 8-bit.
// Colores: blanco/crema + amarillo (gorro chef) + rojo tomate (mandil).
// El brazo derecho sostiene una pizza cuando cooking=true.

export function ChefRobot({ size = 80, action = 'idle', cooking = false }) {
  const s = size / 80
  const eyeColor = cooking ? '#fbbf24' : '#4cc9f0'
  const bodyColor = '#f1f5f9'
  const apronColor = '#e94560'

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 80 96"
      style={{ imageRendering: 'pixelated', overflow: 'visible' }}
    >
      {/* Gorro de chef (cuadrado, estilo 8-bit) */}
      <rect x="20" y="0" width="40" height="16" fill="white" />
      <rect x="24" y="16" width="32" height="6" fill="#e2e8f0" />
      {/* Líneas decorativas del gorro */}
      <rect x="28" y="4" width="4" height="8" fill="#e2e8f0" opacity="0.5" />
      <rect x="36" y="4" width="4" height="8" fill="#e2e8f0" opacity="0.5" />
      <rect x="44" y="4" width="4" height="8" fill="#e2e8f0" opacity="0.5" />

      {/* Cabeza */}
      <rect x="22" y="22" width="36" height="26" fill={bodyColor} />
      <rect x="20" y="24" width="4" height="22" fill="#cbd5e1" />
      <rect x="56" y="24" width="4" height="22" fill="#cbd5e1" />

      {/* Bigote italiano */}
      <rect x="28" y="40" width="8" height="4" fill="#78350f" />
      <rect x="44" y="40" width="8" height="4" fill="#78350f" />
      <rect x="34" y="42" width="12" height="2" fill="#92400e" />

      {/* Ojos LED */}
      <rect x="28" y="28" width="10" height="8" fill={eyeColor} rx="1" />
      <rect x="42" y="28" width="10" height="8" fill={eyeColor} rx="1" />
      <rect x="30" y="29" width="3" height="3" fill="white" opacity="0.6" />
      <rect x="44" y="29" width="3" height="3" fill="white" opacity="0.6" />

      {/* Cuello */}
      <rect x="34" y="48" width="12" height="6" fill="#cbd5e1" />

      {/* Cuerpo con mandil */}
      <rect x="20" y="54" width="40" height="28" fill={bodyColor} />
      {/* Mandil rojo */}
      <rect x="28" y="54" width="24" height="28" fill={apronColor} />
      {/* Cinturón del mandil */}
      <rect x="20" y="64" width="40" height="4" fill="#c41340" />
      {/* Bolsillo */}
      <rect x="32" y="68" width="16" height="10" fill="#c41340" />
      <rect x="34" y="70" width="12" height="6" fill="#9f1239" />

      {/* Brazo izquierdo */}
      <rect x="4" y="56" width="16" height="8" fill={bodyColor} />
      <rect x="0" y="60" width="14" height="8" fill={bodyColor} />
      {/* Mano izquierda con cuchara */}
      <rect x="0" y="64" width="4" height="10" fill="#fbbf24" />
      <rect x="2" y="60" width="2" height="6" fill="#fbbf24" />

      {/* Brazo derecho + pizza */}
      <rect x="60" y="56" width="16" height="8" fill={bodyColor} />
      <rect x="66" y="52" width="14" height="8" fill={bodyColor} />
      {cooking ? (
        // Pizza en el brazo cuando está cocinando
        <>
          <circle cx="76" cy="46" r="10" fill="#fbbf24" />
          <circle cx="76" cy="46" r="8" fill="#ef4444" />
          <circle cx="72" cy="44" r="2" fill="#92400e" />
          <circle cx="78" cy="48" r="2" fill="#92400e" />
          <circle cx="76" cy="42" r="1.5" fill="#4ade80" />
        </>
      ) : (
        // Mano vacía
        <rect x="72" y="56" width="6" height="6" fill="#cbd5e1" />
      )}

      {/* Piernas */}
      <rect x="26" y="82" width="12" height="12" fill="#cbd5e1" />
      <rect x="42" y="82" width="12" height="12" fill="#cbd5e1" />
      {/* Zapatos */}
      <rect x="24" y="90" width="16" height="6" fill="#1e293b" />
      <rect x="40" y="90" width="16" height="6" fill="#1e293b" />
    </svg>
  )
}
