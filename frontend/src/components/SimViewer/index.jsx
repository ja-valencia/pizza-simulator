import { Kitchen } from './Kitchen'
import { PackingZone } from './PackingZone'
import { Street } from './Street'

// SimViewer: layout principal de 3 zonas horizontales.
// Razón del layout en 3 columnas: representa el flujo físico de la pizzería
// de izquierda a derecha — cocina → empaque → calle.
// En pantallas pequeñas colapsa a columna vertical.
export function SimViewer() {
  return (
    <div className="grid gap-3 h-80" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
      <Kitchen />
      <PackingZone />
      <Street />
    </div>
  )
}
