// DeliveryRobot — Robot con ruedas, casco y cajita de delivery.
// Ruedas animadas cuando moving=true (CSS keyframe rotate).
// Colores: verde militar + negro + naranja (detalles de entrega).

export function DeliveryRobot({ size = 80, moving = false, returning = false }) {
  const bodyColor = '#166534'
  const darkColor = '#14532d'
  const accentColor = '#4ade80'
  const helmetColor = '#1f2937'
  const boxColor = '#92400e'

  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 80 88"
      style={{ imageRendering: 'pixelated', overflow: 'visible', transform: returning ? 'scaleX(-1)' : 'scaleX(1)' }}
    >
      {/* Caja de delivery encima */}
      <rect x="24" y="0" width="32" height="20" fill={boxColor} rx="2" />
      <rect x="26" y="2" width="28" height="16" fill="#78350f" rx="1" />
      {/* Logo de pizza en la caja */}
      <rect x="34" y="6" width="12" height="8" fill="#fbbf24" rx="1" />
      <rect x="36" y="8" width="8" height="4" fill="#ef4444" rx="1" />
      {/* Tapa de la caja */}
      <rect x="22" y="18" width="36" height="4" fill="#92400e" />
      {/* Soporte de la caja */}
      <rect x="34" y="20" width="12" height="6" fill={darkColor} />

      {/* Casco */}
      <rect x="20" y="26" width="40" height="22" fill={helmetColor} rx="2" />
      {/* Visera del casco */}
      <rect x="24" y="32" width="32" height="10" fill="#374151" rx="1" />
      <rect x="26" y="34" width="28" height="6" fill="#1e40af" opacity="0.7" />
      {/* Ojos a través de la visera */}
      <rect x="30" y="35" width="8" height="4" fill={accentColor} rx="1" />
      <rect x="42" y="35" width="8" height="4" fill={accentColor} rx="1" />
      {/* Ventilación del casco */}
      <rect x="22" y="42" width="4" height="4" fill="#374151" />
      <rect x="54" y="42" width="4" height="4" fill="#374151" />

      {/* Cuello */}
      <rect x="34" y="48" width="12" height="4" fill={darkColor} />

      {/* Cuerpo compacto */}
      <rect x="18" y="52" width="44" height="22" fill={bodyColor} rx="2" />
      {/* Panel de control en el pecho */}
      <rect x="26" y="56" width="28" height="14" fill={darkColor} rx="1" />
      <rect x="28" y="58" width="8" height="4" fill={accentColor} opacity="0.8" />
      <rect x="40" y="58" width="8" height="4" fill="#fbbf24" opacity="0.8" />
      <rect x="30" y="64" width="20" height="2" fill={accentColor} opacity="0.4" />

      {/* Brazos */}
      <rect x="4" y="54" width="14" height="6" fill={bodyColor} />
      <rect x="0" y="58" width="14" height="6" fill={bodyColor} />
      <rect x="62" y="54" width="14" height="6" fill={bodyColor} />
      <rect x="66" y="58" width="14" height="6" fill={bodyColor} />

      {/* Ruedas — el elemento clave del DeliveryRobot */}
      <g style={moving ? { transformOrigin: '22px 82px', animation: 'spin 0.4s linear infinite' } : {}}>
        <circle cx="22" cy="82" r="10" fill={helmetColor} />
        <circle cx="22" cy="82" r="7" fill="#374151" />
        {/* Radios de la rueda */}
        <line x1="22" y1="75" x2="22" y2="89" stroke={accentColor} strokeWidth="2" />
        <line x1="15" y1="82" x2="29" y2="82" stroke={accentColor} strokeWidth="2" />
        <circle cx="22" cy="82" r="2" fill={accentColor} />
      </g>
      <g style={moving ? { transformOrigin: '58px 82px', animation: 'spin 0.4s linear infinite' } : {}}>
        <circle cx="58" cy="82" r="10" fill={helmetColor} />
        <circle cx="58" cy="82" r="7" fill="#374151" />
        <line x1="58" y1="75" x2="58" y2="89" stroke={accentColor} strokeWidth="2" />
        <line x1="51" y1="82" x2="65" y2="82" stroke={accentColor} strokeWidth="2" />
        <circle cx="58" cy="82" r="2" fill={accentColor} />
      </g>

      {/* CSS para animación de ruedas */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  )
}
