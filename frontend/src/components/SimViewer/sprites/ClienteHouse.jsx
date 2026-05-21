// ClienteHouse — Casa pixel art 8-bit que representa un destino de entrega.
// delivered=true: la casa se vuelve gris (pedido entregado).
// orderId: para mostrar el número de pedido abreviado.

export function ClienteHouse({ size = 60, delivered = false, orderId = '' }) {
  const wallColor = delivered ? '#374151' : '#fbbf24'
  const roofColor = delivered ? '#1f2937' : '#e94560'
  const doorColor = delivered ? '#4b5563' : '#92400e'
  const windowColor = delivered ? '#374151' : '#4cc9f0'
  const labelColor = delivered ? '#6b7280' : '#4cc9f0'

  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 60 78"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Número de pedido */}
      <text x="30" y="8" textAnchor="middle" fill={labelColor} fontSize="7" fontFamily="'Press Start 2P', monospace">
        #{orderId.slice(0, 4)}
      </text>

      {/* Techo (triángulo pixelado con escalonado) */}
      <rect x="28" y="10" width="4" height="4" fill={roofColor} />
      <rect x="24" y="14" width="12" height="4" fill={roofColor} />
      <rect x="20" y="18" width="20" height="4" fill={roofColor} />
      <rect x="16" y="22" width="28" height="4" fill={roofColor} />
      <rect x="12" y="26" width="36" height="4" fill={roofColor} />

      {/* Paredes */}
      <rect x="8" y="30" width="44" height="36" fill={wallColor} />

      {/* Ventana izquierda */}
      <rect x="12" y="36" width="14" height="12" fill={windowColor} rx="1" />
      <rect x="14" y="38" width="4" height="8" fill={delivered ? '#4b5563' : '#93c5fd'} />
      <rect x="20" y="38" width="4" height="8" fill={delivered ? '#4b5563' : '#93c5fd'} />
      <rect x="14" y="42" width="10" height="2" fill={windowColor} />

      {/* Ventana derecha */}
      <rect x="34" y="36" width="14" height="12" fill={windowColor} rx="1" />
      <rect x="36" y="38" width="4" height="8" fill={delivered ? '#4b5563' : '#93c5fd'} />
      <rect x="42" y="38" width="4" height="8" fill={delivered ? '#4b5563' : '#93c5fd'} />
      <rect x="36" y="42" width="10" height="2" fill={windowColor} />

      {/* Puerta */}
      <rect x="24" y="50" width="12" height="16" fill={doorColor} rx="1" />
      <rect x="26" y="52" width="8" height="12" fill={delivered ? '#374151' : '#78350f'} />
      {/* Manija */}
      <rect x="32" y="59" width="3" height="3" fill={delivered ? '#6b7280' : '#fbbf24'} />

      {/* Check de entregado */}
      {delivered && (
        <text x="30" y="24" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="monospace">✓</text>
      )}
    </svg>
  )
}
