# Pizza Simulator — Project Brief

## Concepto
Simulador multi-agente de una pizzería para aprender los componentes
tecnológicos de una solución agéntica: orquestación, inter-agent
communication, persistencia, reglas de negocio configurables y
visualización en tiempo real.

## Agentes y LLMs
| Agente   | LLM               | Rol                                                             |
|----------|-------------------|-----------------------------------------------------------------|
| Manager  | Claude (Anthropic) | Orquesta el workflow, recibe pedidos, gestiona reglas, recibe pagos |
| Chef     | Gemini            | Procesa comandas, hornea, empaca, optimiza batches de pizzas    |
| Delivery | Groq              | Recoge, entrega, cobra, regresa                                 |
| Cliente  | Groq              | Genera pedidos (modo auto) o recibe pedidos manuales del frontend |

## Workflow principal
```
cliente → pedido → manager → comanda → chef → hornea →
chef → empaca → delivery → entrega → cliente → paga →
delivery → regresa → entrega_dinero → manager
```
Todo el workflow es configurable via settings de la pizzería.

## Reglas de negocio (configurables en runtime)
- Delivery solo puede cargar **X pizzas** por viaje
- Cada **X pizzas** o **Y minutos** el Chef debe limpiar su estación
- Pedidos con entrega > **Z minutos** son **gratis**
- Chef puede esperar **Y segundos** para acumular pedidos y optimizar
  el batch antes de hornear (prioriza entregas exitosas, minimiza pizzas gratis)

## Variables de estrés (para pruebas)
- Acumulación de pedidos (rush hour)
- Delivery lento
- Limpieza forzada de estación
- Control de velocidad del tiempo (acelerar/frenar simulación)

## Tech Stack

### Backend
- **Python + FastAPI**
- **LangGraph** — orquestación de agentes, workflow con estado y transiciones
- **Redis** — estado en tiempo real: colas, estado de agentes, reloj simulación
- **PostgreSQL** — historial de órdenes, analytics persistentes
- **WebSockets** nativos de FastAPI — eventos al frontend

### Frontend
- **React + Vite**
- **Framer Motion** — animaciones del sim viewer
- **Recharts** — gráficas de analytics
- **Howler.js** — sonido por eventos
- **Tailwind CSS** — diseño limpio

## Frontend — dos vistas principales

### 1. Sim Viewer
Representación visual de la pizzería en tiempo real:
- Layout: `cocina | zona empaque | zona delivery | calle`
- Cada agente tiene representación visual y se mueve/reacciona
- Animaciones por evento: hornear, empacar, delivery en ruta, pago
- Sonidos por evento

### 2. Dashboard Analytics
- Métricas en tiempo real: pedidos activos, tiempo promedio, pizzas gratis, eficiencia por agente
- Historial y gráficas
- Panel de control: settings de la pizzería, modo manual/auto, escenarios de estrés, velocidad del tiempo

## Plan de fases
| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Setup: repo limpio, MCP Draw.io, documentación inicial | ✅ Completada |
| 1 | Fundación: FastAPI + WebSocket + modelos de datos + Redis/PostgreSQL | 🔄 En progreso |
| 2 | Motor de simulación: reloj, event bus, business rules engine | ⏳ Pendiente |
| 3 | Agentes con LangGraph: grafo de workflow, cada agente con su LLM y skills | ⏳ Pendiente |
| 4 | Frontend Sim Viewer: layout, agentes visuales, animaciones, sonido | ⏳ Pendiente |
| 5 | Frontend Dashboard: métricas, control panel, stress testing | ⏳ Pendiente |
| 6 | Polish: tuning de reglas, escenarios, UX final | ⏳ Pendiente |

## Principios de desarrollo
- Fase por fase — nada especulativo
- Cada fase entrega algo **funcional y verificable**
- Reglas de negocio **desacopladas** del código de agentes
- **Eventos como ciudadanos de primera clase** — todo lo que pasa en la simulación es un evento
