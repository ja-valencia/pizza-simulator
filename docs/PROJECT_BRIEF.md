# Pizza Simulator — Project Brief

> Última actualización: 2026-05-21 | Fase 4 completada

## Concepto

Simulador multi-agente de una pizzería para aprender los componentes tecnológicos
de una solución agéntica: orquestación, inter-agent communication, persistencia,
reglas de negocio configurables y visualización en tiempo real.

**Objetivo de aprendizaje:** No es un producto comercial — es un laboratorio
práctico para entender LangGraph, multi-LLM architecture, WebSockets, y
event-driven design construyendo algo concreto y visual.

---

## Agentes y LLMs

| Agente   | LLM                         | Por qué este modelo |
|----------|-----------------------------|---------------------|
| Manager  | **Gemini 2.0 Flash** (Google) | Toma las decisiones más complejas: validar pedidos, orquestar el workflow, cerrar transacciones. Gemini Flash ofrece mejor razonamiento que modelos pequeños, a costo razonable en free tier. |
| Chef     | **Gemini 2.0 Flash** (Google) | Necesita seguir instrucciones precisas (recetas, tiempos, orden de operaciones). Mismo modelo que Manager para simplificar la integración y compartir el rate limit. |
| Delivery | **Groq llama-3.3-70b** | Decisiones simples y rápidas (aceptar carga, registrar entrega). Groq tiene latencia ultra baja (~100ms) vs Gemini (~800ms), ideal para acciones que no requieren razonamiento profundo. |
| Cliente  | **Groq llama-3.1-8b-instant** | Solo genera narrativa de pedidos — el modelo más económico y rápido es suficiente. Máxima velocidad para simular múltiples clientes concurrentes sin colapsar el rate limit. |

### Historial de cambios de LLM

- **Intento inicial**: `gemini-1.5-pro` / `gemini-1.5-flash` → **Error 404** (modelos retirados de la API v1beta con esta API key).
- **Corrección**: cambiado a `gemini-2.0-flash` para ambos.
- **Incidente de cuota (Fase 3)**: los pedidos automáticos con probabilidad 0.3 cada 2.5s generaron ~6-8 órdenes concurrentes × 7 llamadas LLM = ~50 llamadas en 20s → agotó el límite de 15 RPM del free tier y potencialmente el límite diario. **Solución temporal**: todos los agentes movidos a Groq. **Solución definitiva**: auto-pedidos desactivados (`probability=0.0`), Manager y Chef restaurados a Gemini en Fase 4.

### API Keys requeridas

- `GOOGLE_API_KEY` — Google AI Studio: https://aistudio.google.com
- `GROQ_API_KEY` — Groq Console: https://console.groq.com

### Rate limits del free tier

| Proveedor | Límite RPM | Límite RPD | Recomendación |
|-----------|-----------|-----------|---------------|
| Gemini 2.0 Flash | 15 req/min | 1,500 req/día | Máximo 2 pedidos concurrentes |
| Groq llama-3.3-70b | 30 req/min | ilimitado | Sin restricciones prácticas |
| Groq llama-3.1-8b | 30 req/min | ilimitado | Sin restricciones prácticas |

---

## Workflow del pedido

```
Cliente → [ORDER_CREATED]
  → Manager → [ORDER_ACCEPTED] → [COMANDA_SENT]
    → Chef → [PIZZA_COOKING] → [PIZZA_BAKED] → [PIZZA_PACKED]
      (opcional: [STATION_CLEANING] antes de hornear)
      → Delivery → [DELIVERY_DISPATCHED] → [DELIVERED]
        → Manager → [PAYMENT_RECEIVED | PAYMENT_FREE] → [DELIVERY_RETURNED]
```

Todo el workflow está codificado como un grafo LangGraph — cada flecha es un edge,
cada acción entre corchetes es un evento del EventBus.

**¿Por qué LangGraph?** Permite modelar el workflow como un grafo de estados con
edges condicionales (¿limpiar estación? → sí/no; ¿entrega gratis? → sí/no).
Alternativas evaluadas: CrewAI (más opinionado), SDK directo (más control pero más boilerplate).

---

## Reglas de negocio (configurables en runtime)

Todas las reglas viven en `SimConfig` (Redis) y se modifican desde el frontend sin reiniciar.
**¿Por qué Redis?** Estado compartido entre agentes en tiempo real, sin round-trip a Postgres.

| Regla | Default | Por qué existe |
|-------|---------|---------------|
| `max_delivery_capacity` | 5 pizzas/viaje | Simula limitación física real — fuerza al sistema a optimizar batches |
| `station_clean_every_n_pizzas` | 10 pizzas | Introduce interrupción periódica del Chef — crea stress natural |
| `station_clean_every_minutes` | 30 min | Segunda condición de limpieza para simular higiene obligatoria |
| `chef_batch_wait_seconds` | 30s | El Chef puede esperar para agrupar pedidos — optimización vs latencia |
| `free_delivery_after_minutes` | 45 min | SLA de entrega — penaliza al sistema si es lento (pizza gratis) |
| `sim_speed_multiplier` | 1.0 | Acelerar/frenar la simulación para observar comportamientos a distintas velocidades |

---

## Tech Stack

### Backend

| Tecnología | Por qué |
|-----------|---------|
| **Python + FastAPI** | Async nativo, WebSockets built-in, tipado con Pydantic. Estándar de facto para APIs IA en Python. |
| **LangGraph** | Modela el workflow multi-agente como grafo de estados con edges condicionales. Mejor que SDK directo para workflows complejos. |
| **Redis** | Estado en tiempo real: colas, estado de agentes, reloj de simulación, SimConfig. Pub/sub para eventos futuros. |
| **PostgreSQL** | Historial persistente de órdenes y eventos para analytics. SQLAlchemy async con asyncpg driver. |
| **WebSockets** | Canal bidireccional para eventos en tiempo real al frontend. Nativo en FastAPI, sin dependencias extra. |

### Frontend

| Tecnología | Por qué |
|-----------|---------|
| **React 18 + Vite** | Vite es ~10x más rápido que CRA para desarrollo. React por ecosistema y familiaridad. |
| **Tailwind CSS v4** | Utility-first, sin configuración separada con el plugin de Vite. Diseño rápido y consistente. |
| **Framer Motion** | Animaciones declarativas en React. Ideal para animar por evento (animKey pattern). |
| **Zustand** | Store global sin boilerplate. Más simple que Redux para estado de WebSocket en tiempo real. |
| **Web Audio API** | Tonos generados en código, sin archivos externos. Se reemplazará con Howler.js + samples en Fase 6. |
| **Press Start 2P** | Fuente 8-bit de Google Fonts. Establece identidad visual retro desde Fase 4, lista para sprites en Fase 6. |

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  SimViewer (3 zonas) │ EventLog │ SimControls │ Clock   │
│              WebSocket client (Zustand store)            │
└──────────────────────┬──────────────────────────────────┘
                       │ ws://localhost:8000/ws
┌──────────────────────▼──────────────────────────────────┐
│               BACKEND (FastAPI + Python)                 │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              LangGraph Orchestrator               │  │
│  │  Cliente(Groq) → Manager(Gemini) → Chef(Gemini)  │  │
│  │              → Delivery(Groq) → Manager(Gemini)  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  SimClock (asyncio) │ EventBus │ BusinessRulesEngine    │
│                                                          │
│  Redis (SimConfig, sim_time, agent states)              │
│  PostgreSQL (orders, events — historial)                │
└─────────────────────────────────────────────────────────┘
```

---

## Estructura del proyecto

```
ClaudePizza/
├── backend/
│   ├── app/
│   │   ├── agents/          ← LangGraph: state, graph, runner, agentes LLM
│   │   ├── api/             ← REST endpoints (sim control, orders)
│   │   ├── db/              ← PostgreSQL (async SQLAlchemy) + Redis
│   │   ├── models/          ← Pydantic + SQLAlchemy models
│   │   ├── sim/             ← Clock, EventBus, BusinessRulesEngine
│   │   ├── ws/              ← WebSocket manager
│   │   └── main.py          ← FastAPI app + lifespan
│   ├── requirements.txt
│   └── .env                 ← API keys (no committeado)
├── frontend/
│   └── src/
│       ├── components/      ← SimViewer, EventLog, SimControls, SimClock
│       ├── hooks/           ← useWebSocket, useSound
│       ├── services/        ← api.js (fetch helpers)
│       └── store/           ← simStore.js (Zustand)
├── docs/
│   ├── PROJECT_BRIEF.md     ← Este archivo
│   ├── progress.md          ← Estado de fases
│   └── architecture.md      ← Diagramas
├── docker-compose.yml       ← Redis + PostgreSQL
└── .claude/settings.json   ← Config Claude Code (acceptEdits, MCP drawio)
```

---

## Plan de fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Setup: repo, MCP Draw.io, documentación inicial | ✅ |
| 1 | Fundación: FastAPI + WebSocket + modelos + Redis/PostgreSQL | ✅ |
| 2 | Motor de simulación: reloj, event bus, business rules | ✅ |
| 3 | Agentes LangGraph: grafo, 4 agentes con LLMs reales | ✅ |
| 4 | Frontend Sim Viewer: visualización en tiempo real, animaciones, sonido | ✅ |
| 5 | Dashboard Analytics: métricas, control panel, stress testing | ✅ |
| 6 | Polish: sprites 8-bit robots, pipeline visual, documentación técnica | ✅ |

---

## Cómo correr el proyecto

```bash
# 1. Infraestructura
docker-compose up -d

# 2. Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 3. Frontend (en otra terminal)
cd frontend
npm run dev
```

Abrir: **http://localhost:5173**

---

## Principios de desarrollo

1. **Fase por fase** — nada especulativo, cada fase entrega algo funcional
2. **Reglas de negocio desacopladas** — `BusinessRulesEngine` separado de los agentes
3. **Eventos como ciudadanos de primera clase** — todo cambio de estado es un evento
4. **LLMs para narrativa, lógica para decisiones** — predecible y educativo
5. **Preparado para Fase 6** — `pixel-art` CSS class, `AgentSprite` intercambiable
