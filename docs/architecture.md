# Pizza Simulator — Architecture

> Diagramas detallados se generarán con Draw.io MCP conforme avance el proyecto.

## Vista general

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  ┌──────────────────┐  ┌───────────────────────┐    │
│  │   Sim Viewer     │  │  Dashboard Analytics  │    │
│  │  (animaciones)   │  │  (métricas, charts)   │    │
│  └──────────────────┘  └───────────────────────┘    │
│           Control Panel (settings, pedidos)          │
│                  WebSocket client                    │
└─────────────────────┬───────────────────────────────┘
                      │ WebSocket (eventos en tiempo real)
┌─────────────────────▼───────────────────────────────┐
│               BACKEND (FastAPI)                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │           LangGraph Orchestrator             │   │
│  │  Cliente → Manager → Chef → Delivery → ...  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Agentes:                                            │
│  • Manager  → Claude (Anthropic)                     │
│  • Chef     → Gemini                                 │
│  • Delivery → Groq                                   │
│  • Cliente  → Groq                                   │
│                                                      │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ Simulation      │  │ Business Rules Engine    │  │
│  │ Engine          │  │ (configurable settings)  │  │
│  │ (time control)  │  │                          │  │
│  └─────────────────┘  └──────────────────────────┘  │
│                                                      │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │    Redis     │  │        PostgreSQL             │ │
│  │ (real-time   │  │  (historial + analytics)     │ │
│  │  state/queues│  │                              │ │
│  └──────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Workflow de un pedido

```
[Cliente Agent]
     │ genera pedido
     ▼
[Manager Agent] ──── valida reglas de negocio
     │ envía comanda
     ▼
[Chef Agent] ──── verifica capacidad / limpieza pendiente
     │ hornea + empaca (optimiza batch si hay pedidos en cola)
     ▼
[Delivery Agent] ──── verifica capacidad de carga
     │ entrega al cliente
     ▼
[Cliente] paga
     │
[Delivery Agent] regresa con pago
     │
[Manager Agent] ──── registra transacción, actualiza analytics
```

## Event Bus

Todo evento en la simulación tiene esta estructura:
```json
{
  "event_id": "uuid",
  "timestamp": "sim_time",
  "type": "ORDER_CREATED | COMANDA_SENT | PIZZA_BAKED | ...",
  "agent": "manager | chef | delivery | cliente",
  "payload": {}
}
```

Los eventos se publican en Redis y se transmiten por WebSocket al frontend.
