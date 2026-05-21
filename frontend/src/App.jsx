import { useWebSocket } from './hooks/useWebSocket'
import { SimViewer } from './components/SimViewer'
import { SimControls } from './components/SimControls'
import { SimClock } from './components/SimClock'
import { EventLog } from './components/EventLog'

function App() {
  // Hook que conecta el WebSocket y despacha eventos al store global
  useWebSocket()

  return (
    <div style={{ minHeight: '100vh', padding: '16px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ color: 'var(--accent-red)', fontSize: '14px' }}>
          🍕 PIZZA SIMULATOR
        </div>
        <SimClock />
      </div>

      {/* Controles */}
      <div className="mb-4">
        <SimControls />
      </div>

      {/* Vista principal de la pizzería */}
      <div className="mb-4">
        <SimViewer />
      </div>

      {/* Feed de eventos en tiempo real */}
      <EventLog />

    </div>
  )
}

export default App
