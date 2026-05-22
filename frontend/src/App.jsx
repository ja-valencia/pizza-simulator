import { useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { SimViewer } from './components/SimViewer'
import { SimControls } from './components/SimControls'
import { SimClock } from './components/SimClock'
import { EventLog } from './components/EventLog'
import { Dashboard } from './components/Dashboard'
import { PipelineTracker } from './components/PipelineTracker'
import { HowToUse } from './components/HowToUse'
import { SimPanel } from './components/SimPanel'

function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--accent-red)' : 'transparent',
      border: `1px solid ${active ? 'var(--accent-red)' : 'var(--border)'}`,
      color: active ? '#fff' : 'var(--text-dim)',
      padding: '4px 12px', borderRadius: '4px',
      cursor: 'pointer', fontSize: '9px', fontFamily: 'inherit',
    }}>
      {label}
    </button>
  )
}

function App() {
  useWebSocket()
  const [activeTab, setActiveTab] = useState('viewer')

  return (
    <div style={{ minHeight: '100vh', padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ color: 'var(--accent-red)', fontSize: '14px' }}>
          🍕 PIZZA SIMULATOR
        </div>
        <div className="flex items-center gap-4">
          <SimClock />
          <div className="flex gap-2">
            <TabButton label="SIM VIEWER"  active={activeTab === 'viewer'}    onClick={() => setActiveTab('viewer')} />
            <TabButton label="DASHBOARD"   active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          </div>
        </div>
      </div>

      {/* Guía de uso — colapsable, visible la primera vez */}
      <HowToUse />

      {/* Controles — siempre visibles */}
      <div className="mb-3">
        <SimControls />
      </div>

      {activeTab === 'viewer' ? (
        <>
          {/* Tracker del pedido activo con timing */}
          <PipelineTracker />
          <div className="mb-2">
            <SimViewer />
          </div>
          <SimPanel />
          <EventLog />
        </>
      ) : (
        <Dashboard active={activeTab === 'dashboard'} />
      )}

    </div>
  )
}

export default App
