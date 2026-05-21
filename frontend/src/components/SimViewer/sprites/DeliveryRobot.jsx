// DeliveryRobot — Robot blanco/rojo, fusión ruedas + robot.
// Diseño: caja de pizza arriba, cabeza y cuerpo con brazos en el centro,
// un solo eje horizontal con dos ruedas en los extremos abajo.
// Colores: blanco (#f8fafc) + rojo (#dc2626) — estilo scooter delivery moderno.

export function DeliveryRobot({ size = 80, moving = false, returning = false }) {
  const bodyColor   = '#f8fafc'   // blanco principal
  const accentColor = '#dc2626'   // rojo
  const darkColor   = '#1e293b'   // oscuro (ruedas, bordes)
  const midColor    = '#e2e8f0'   // blanco suave (detalles)

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 80 96"
      style={{ imageRendering: 'pixelated', overflow: 'visible', transform: returning ? 'scaleX(-1)' : 'scaleX(1)' }}
    >
      {/* ===== CAJA DE PIZZA — compartimento de almacenamiento en la cabeza ===== */}
      <rect x="22" y="0" width="36" height="20" fill={accentColor} rx="2" />
      <rect x="24" y="2" width="32" height="16" fill="#b91c1c" rx="1" />
      {/* Logo de pizza en la caja */}
      <rect x="32" y="4" width="16" height="12" fill={bodyColor} rx="1" opacity="0.9" />
      <circle cx="40" cy="10" r="5" fill="#fbbf24" />
      <circle cx="40" cy="10" r="3" fill={accentColor} />
      <circle cx="40" cy="10" r="1" fill="#fbbf24" />
      {/* Tapa */}
      <rect x="20" y="18" width="40" height="4" fill="#991b1b" />

      {/* Soporte caja → cabeza */}
      <rect x="34" y="22" width="12" height="7" fill={darkColor} />

      {/* ===== CABEZA ===== */}
      <rect x="22" y="29" width="36" height="22" fill={bodyColor} rx="2" />
      {/* Bordes laterales cabeza */}
      <rect x="20" y="31" width="4" height="18" fill={midColor} />
      <rect x="56" y="31" width="4" height="18" fill={midColor} />
      {/* Visera roja */}
      <rect x="22" y="35" width="36" height="10" fill={accentColor} opacity="0.18" />
      {/* Ojos LED rojos */}
      <rect x="27" y="36" width="11" height="6" fill={accentColor} rx="1" />
      <rect x="42" y="36" width="11" height="6" fill={accentColor} rx="1" />
      {/* Brillo en ojos */}
      <rect x="29" y="37" width="3" height="3" fill={bodyColor} opacity="0.7" />
      <rect x="44" y="37" width="3" height="3" fill={bodyColor} opacity="0.7" />
      {/* Boca */}
      <rect x="30" y="45" width="20" height="3" fill={midColor} />

      {/* Cuello */}
      <rect x="34" y="51" width="12" height="6" fill={midColor} />

      {/* ===== CUERPO ===== */}
      <rect x="18" y="57" width="44" height="18" fill={bodyColor} rx="2" />
      {/* Franja roja diagonal en el cuerpo */}
      <rect x="18" y="61" width="44" height="5" fill={accentColor} opacity="0.85" />
      {/* Panel pecho */}
      <rect x="27" y="58" width="26" height="16" fill={midColor} rx="1" />
      <rect x="29" y="60" width="9" height="4" fill={accentColor} opacity="0.8" />
      <rect x="42" y="60" width="9" height="4" fill="#fbbf24" opacity="0.8" />
      <rect x="31" y="66" width="18" height="2" fill={darkColor} opacity="0.2" />

      {/* ===== BRAZOS ===== */}
      {/* Brazo izquierdo */}
      <rect x="4"  y="59" width="14" height="6" fill={bodyColor} />
      <rect x="0"  y="63" width="14" height="6" fill={bodyColor} />
      <rect x="0"  y="67" width="9"  height="5" fill={midColor} rx="1" />
      {/* Brazo derecho */}
      <rect x="62" y="59" width="14" height="6" fill={bodyColor} />
      <rect x="66" y="63" width="14" height="6" fill={bodyColor} />
      <rect x="71" y="67" width="9"  height="5" fill={midColor} rx="1" />

      {/* ===== EJE ÚNICO — barra horizontal que conecta ambas ruedas ===== */}
      <rect x="8" y="75" width="64" height="6" fill={darkColor} rx="2" />
      {/* Conectores cuerpo → eje */}
      <rect x="27" y="75" width="8" height="4" fill="#334155" />
      <rect x="45" y="75" width="8" height="4" fill="#334155" />

      {/* ===== RUEDAS (eje único, rueda izquierda y derecha) ===== */}
      {/* Rueda izquierda */}
      <g style={moving ? { transformOrigin: '18px 85px', animation: 'spin 0.4s linear infinite' } : {}}>
        <circle cx="18" cy="85" r="11" fill={darkColor} />
        <circle cx="18" cy="85" r="8"  fill="#334155" />
        {/* Radios */}
        <line x1="18" y1="77" x2="18" y2="93" stroke={accentColor} strokeWidth="2" />
        <line x1="10" y1="85" x2="26" y2="85" stroke={accentColor} strokeWidth="2" />
        <line x1="12" y1="79" x2="24" y2="91" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
        <line x1="24" y1="79" x2="12" y2="91" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
        <circle cx="18" cy="85" r="3" fill={accentColor} />
      </g>
      {/* Rueda derecha */}
      <g style={moving ? { transformOrigin: '62px 85px', animation: 'spin 0.4s linear infinite' } : {}}>
        <circle cx="62" cy="85" r="11" fill={darkColor} />
        <circle cx="62" cy="85" r="8"  fill="#334155" />
        <line x1="62" y1="77" x2="62" y2="93" stroke={accentColor} strokeWidth="2" />
        <line x1="54" y1="85" x2="70" y2="85" stroke={accentColor} strokeWidth="2" />
        <line x1="56" y1="79" x2="68" y2="91" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
        <line x1="68" y1="79" x2="56" y2="91" stroke={accentColor} strokeWidth="1.5" opacity="0.7" />
        <circle cx="62" cy="85" r="3" fill={accentColor} />
      </g>

      {/* CSS animación de ruedas */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  )
}
