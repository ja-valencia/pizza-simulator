# Pizza Simulator — Progress Tracker

> Cada ítem incluye el *por qué* se hizo, no solo el qué.

---

## Fase 0 — Setup ✅

- [x] **Repo limpio** (eliminados: `skills/`, `.claude-plugin/`, `.cursor/skills/`)
  → Esos directorios eran artefactos del marketplace de plugins de Claude Code que no sirven localmente. Tener el repo limpio evita confusión al trabajar con Cursor y Claude Code simultáneamente.

- [x] **CLAUDE.md con guidelines de desarrollo**
  → Claude Code carga este archivo automáticamente en cada sesión. Contiene las Karpathy Guidelines (simplicity first, surgical changes) para evitar los errores más comunes al codear con LLMs.

- [x] **`.cursor/rules/karpathy-guidelines.mdc` para Cursor**
  → Cursor usa `.cursor/rules/` en lugar de `CLAUDE.md`. `alwaysApply: true` hace que las reglas se apliquen en cada conversación de Cursor. Mismo contenido, dos formatos distintos por herramienta.

- [x] **Draw.io MCP configurado (`.mcp.json`)**
  → Permite crear diagramas de arquitectura directamente desde Claude Code sin salir del flujo de trabajo. Configurado como servidor remoto SSE (`https://mcp.draw.io/mcp`) — sin instalación local.

- [x] **Documentación inicial (`docs/`)**
  → `PROJECT_BRIEF.md`, `architecture.md`, `progress.md` creados antes de escribir código. Razón: documentar el *por qué* antes de implementar previene decisiones técnicas sin justificación y facilita retomar el proyecto después de pausas.

---

## Fase 1 — Fundación ✅

- [x] **Estructura de carpetas del proyecto (`backend/`)**
  → Separación clara `backend/` y `frontend/` como monorepo. Dentro del backend, `app/models/`, `app/db/`, `app/ws/`, `app/api/` organizados por responsabilidad, no por tipo de archivo.

- [x] **FastAPI app base con lifespan**
  → `lifespan` (asynccontextmanager) maneja startup/shutdown: inicializa DB, Redis, clock y runner. Es el patrón recomendado en FastAPI moderno (vs `@app.on_event` deprecado).

- [x] **Modelos de datos (Order, SimConfig, Event)**
  → Tres modelos centrales: `OrderStatus` (enum de 9 estados del ciclo), `EventType` (12 tipos de eventos del negocio), `SimConfig` (reglas configurables). Doble representación: Pydantic (API) + SQLAlchemy (DB).

- [x] **WebSocket channel (`/ws`)**
  → Canal de evento único para todo el frontend. Al conectarse, el cliente recibe el estado actual (SimConfig). Un solo endpoint simplifica el debug vs múltiples canales por tipo.

- [x] **Redis setup (`db/redis.py`)**
  → Redis como store de estado en tiempo real: SimConfig, sim_time, estado de agentes. Se eligió sobre mantener estado en memoria porque sobrevive reinicios del servidor y en el futuro puede escalar a múltiples procesos.

- [x] **PostgreSQL setup + tablas automáticas**
  → `init_db()` llama `create_all()` al arrancar — sin Alembic en esta fase. Razón: Alembic agrega complejidad innecesaria cuando aún está evolucionando el schema. Se puede agregar en una fase posterior si el schema se estabiliza.

- [x] **`docker-compose.yml` (Redis + PostgreSQL)**
  → Redis 7-alpine y PostgreSQL 16-alpine con healthchecks. Docker evita instalaciones manuales y garantiza versiones consistentes. Healthchecks aseguran que los servicios estén listos antes de que FastAPI intente conectarse.

- [x] **Health endpoint verificado: `{"status":"ok","redis":"ok","postgres":"ok"}`**
  → Criterio de éxito de Fase 1. Si este endpoint retorna OK, toda la infraestructura base funciona.

---

## Fase 2 — Motor de simulación ✅

- [x] **Reloj de simulación (`sim/clock.py`)**
  → `SimClock` es una asyncio.Task que avanza `sim_time` cada 0.5s reales × `speed_multiplier`. Persiste el tiempo en Redis para que sea accesible desde cualquier parte del sistema sin pasar el objeto por parámetro.

- [x] **Event bus (`sim/event_bus.py`)**
  → Punto único de publicación de eventos: guarda en PostgreSQL (historial) y hace broadcast por WebSocket (tiempo real). Centralizar evita duplicar la lógica de persistencia en cada agente.

- [x] **Business rules engine (`sim/rules.py`)**
  → Funciones estáticas sin estado: `is_delivery_free()`, `needs_station_cleaning()`, `can_accept_delivery()`, `should_batch_more()`. Sin efectos secundarios → testeable y predecible. Los agentes llaman estas funciones para decidir, pero no las reglas deciden por los agentes.

- [x] **Endpoints de control (`/sim/start|stop|reset|status`)**
  → Control explícito del reloj desde el frontend. `reset` solo funciona si el reloj está detenido — previene resets accidentales en medio de una simulación.

- [x] **Velocidad del reloj se actualiza en tiempo real al cambiar `/config`**
  → `PUT /config` llama `clock.set_speed()` directamente. Sin esto, habría que reiniciar la simulación para cambiar la velocidad — rompería la experiencia de "jugar con variables en vivo".

---

## Fase 3 — Agentes con LangGraph ✅

- [x] **Grafo LangGraph (9 nodos, edges condicionales)**
  → El ciclo de vida de un pedido modelado como estado máquina: `accept_order → check_batch → check_station → cook → pack → dispatch → deliver → close_order`. Los edges condicionales manejan los casos de limpieza de estación y entregas gratis sin `if/else` dispersos.

- [x] **Manager Agent → Gemini 2.0 Flash**
  → Restaurado a Gemini tras incidente de cuota. Gemini elegido por mejor razonamiento para las tareas complejas del Manager (validación, orquestación, cierre de órdenes). *(Estuvo temporalmente en Groq llama-3.3-70b durante el incidente de cuota de Fase 3).*

- [x] **Chef Agent → Gemini 2.0 Flash**
  → Gemini elegido por consistencia en seguimiento de instrucciones (recetas, tiempos de cocción). Mismo modelo que Manager para simplificar el setup y compartir el rate limit.

- [x] **Delivery Agent → Groq llama-3.3-70b**
  → Groq elegido por latencia ultra baja (~100ms). El Delivery toma decisiones simples (aceptar carga, registrar entrega) — no necesita el razonamiento de Gemini.

- [x] **Cliente Agent → Groq llama-3.1-8b-instant**
  → El modelo más rápido y barato. Solo genera narrativa de pedidos — no toma decisiones de negocio. Optimizado para potenciales múltiples clientes concurrentes en Fase 5.

- [x] **BusinessRulesEngine integrado en cada nodo**
  → Los agentes LLM generan narrativa, pero las decisiones (¿limpiar? ¿gratis? ¿cargar?) las toma el `BusinessRulesEngine`. Esto hace la simulación predecible y las reglas auditables.

- [x] **EventBus publica a WebSocket en cada transición**
  → Cada cambio de estado del pedido genera un evento que llega al frontend en tiempo real. El frontend no hace polling — recibe push de cada transición.

- [x] **Verificado: ciclo completo ORDER_CREATED → PAID**
  → Pedido de `['margarita']` completó el workflow completo en ~20s con 7 llamadas LLM reales (una por nodo relevante). Status final: `PAID`.

- [x] **Auto-pedidos desactivados (`probability=0.0`)**
  → Lección aprendida: con `probability=0.3` cada 2.5s se generaron ~6 pedidos concurrentes × 7 llamadas = ~50 requests en 20s, agotando el límite de 15 RPM de Gemini. Se controlarán desde el frontend en Fase 5.

---

## Fase 4 — Frontend Sim Viewer ✅

- [x] **React 18 + Vite + Tailwind CSS v4**
  → Vite por velocidad de HMR en desarrollo. Tailwind v4 con el plugin de Vite (sin `tailwind.config.js` separado). React 18 para Concurrent Features que Framer Motion aprovecha.

- [x] **Zustand store (`simStore.js`)**
  → Estado global: `simTime`, `agentStates`, `orders`, `recentEvents`. Zustand sobre Redux por la API mínima y la granularidad de re-renders. El patrón `animKey` (incrementa con cada update) permite que Framer Motion re-dispare animaciones sin montar/desmontar componentes.

- [x] **`useWebSocket`: WebSocket con reconexión automática**
  → Conecta a `/ws` (proxied por Vite a `ws://localhost:8000/ws`). En `onclose` espera 3s y reconecta — el backend puede reiniciarse sin que el usuario tenga que recargar la página.

- [x] **`useSound`: tonos Web Audio API por EventType**
  → Sonidos generados en código (no archivos externos). Razón: cero dependencias de assets en desarrollo. Se reemplazarán con samples Howler.js en Fase 6. Cada EventType tiene una frecuencia y duración distinta para feedback auditivo diferenciado.

- [x] **SimViewer: 3 zonas en grid horizontal**
  → Layout `grid-cols-3` representa el flujo físico de izquierda a derecha: Cocina → Empaque → Calle. CSS grid en vez de flexbox para que las 3 zonas sean iguales sin importar el contenido.

- [x] **`AgentSprite`: emoji + Framer Motion (preparado para sprites)**
  → Hoy: emoji grande. En Fase 6: reemplazar por `<img>` con sprite PNG 8-bit. La clase `pixel-art` (`image-rendering: pixelated`) ya está lista. El `animKey` pattern garantiza que cada evento re-dispara la animación.

- [x] **EventLog: feed tiempo real con fade-in + sonido**
  → Muestra los últimos 15 eventos con timestamp de simulación, agente, tipo y mensaje del LLM. `AnimatePresence` de Framer Motion hace el fade-in de cada evento nuevo. El sonido se dispara en el `useEffect` cuando cambia `recentEvents`.

- [x] **SimControls: ▶/⏹/↺, velocidad, modal de pedido**
  → Los botones llaman a `api.js` que proxea al backend. La velocidad cambia via `PUT /config` (no reinicia la simulación). El modal de pedido manual es la forma de crear pedidos en esta fase (sin auto-pedidos).

- [x] **Estética retro 8-bit: Press Start 2P font, paleta oscura**
  → La fuente establece la identidad visual desde Fase 4. Las variables CSS (`--accent-red`, `--bg-kitchen`, etc.) facilitan cambiar la paleta en Fase 6 sin buscar colores hardcodeados.

- [x] **`acceptEdits` configurado en `.claude/settings.json`**
  → Claude Code ya no pide confirmación para editar archivos en este proyecto. Acelera el flujo de trabajo en fases donde hay muchos archivos que crear/modificar.

---

## Fase 5 — Dashboard Analytics ✅

- [x] **SimConfig extendido: `auto_order_enabled` + `auto_order_interval_seconds`**
  → Antes hardcodeados a 0. Moverlos a SimConfig los hace configurables en runtime
  desde el frontend sin reiniciar el servidor — cualquier cambio se refleja en segundos.

- [x] **SimRunner lee SimConfig de Redis en cada loop**
  → El runner consulta Redis cada 2.5s. Si el usuario activa auto-pedidos desde el
  Dashboard, el runner los ve en el siguiente tick sin restart.

- [x] **`api/analytics.py`: `/summary`, `/timeline`, `/orders-by-status`**
  → Agregaciones en el backend (SQL), no en el frontend. COUNT y GROUP BY son más
  eficientes en PostgreSQL que iterar arrays en JS.

- [x] **`useAnalytics` hook: polling cada 5s**
  → Las métricas son agregaciones, no eventos — el backend no sabe cuándo cambia un KPI.
  5s es suficiente sin sobrecargar la DB. El hook solo actúa cuando el tab está visible.

- [x] **`MetricsCards`: KPIs con color semántico**
  → 4 cards: total pedidos, completados, on-time rate, órdenes en memoria.
  On-time rate cambia de verde a rojo si baja del 80% — feedback visual inmediato.

- [x] **`ConfigPanel`: sliders para todas las reglas de SimConfig**
  → Cada slider llama `api.updateConfig()` al cambiar. El backend persiste en Redis
  y hace broadcast `CONFIG_UPDATED` — todos los clientes WebSocket reciben el cambio.

- [x] **`StressPanel`: 4 escenarios preset**
  → RUSH HOUR (5 pedidos a la vez), SLOW DELIVERY (SLA=2min), DIRTY KITCHEN
  (limpieza cada pizza), RESET CONFIG. Permiten explorar el sistema bajo estrés
  con un clic, sin tener que configurar manualmente cada parámetro.

- [x] **`OrdersChart`: LineChart (historial) + PieChart (distribución)**
  → LineChart: polling 8s a /analytics/timeline. PieChart: datos del store Zustand
  (sin polling — ya en memoria). Dos fuentes para complementar sin duplicar requests.

- [x] **Tab navigation en App.jsx: SIM VIEWER | DASHBOARD**
  → `useState` local en App — no necesita React Router para solo 2 vistas.
  SimControls siempre visible porque ▶/⏹ aplican a ambas vistas.

- [x] **Verificado: analytics retornan datos reales**
  → 59 órdenes del testing de Fase 3 aparecen en `/analytics/summary`.

---

## Fase 6 — Polish ✅

- [x] **SVG robots 8-bit para cada agente**
  → Manager (azul/gris con tablet), Chef (blanco/amarillo con gorro), Delivery (verde con
  ruedas y cajita), ClienteHouse (casa pixelada). SVG puro sin imágenes externas —
  escalable, animable con Framer Motion, nítido con `image-rendering: pixelated`.

- [x] **Pipeline visual izquierda→derecha (20/30/50%)**
  → Rediseño completo del SimViewer como línea de producción estilo Nintendo.
  ManagerZone (20%), ChefZone (30%), DeliveryZone (50%) con proporciones fijas.
  Cada zona tiene su propio fondo y robot con animaciones específicas por evento.

- [x] **Comanda volando de Manager → Chef**
  → Overlay absoluto con `motion.div` que anima la posición horizontal al recibir
  `COMANDA_SENT`. El emoji "📋" cruza la pantalla con filter glow. Implementado
  con `AnimatePresence` para entrada/salida suave.

- [x] **Delivery bot con ruedas y movimiento entre casas**
  → El robot Delivery tiene ruedas SVG animadas (`@keyframes spin` cuando `moving=true`).
  Se mueve horizontalmente en la DeliveryZone con `motion.div animate={{ left: X% }}`.
  Las ruedas se invierten (`scaleX(-1)`) cuando regresa.

- [x] **Casas dinámicas por pedido activo**
  → Cada `DELIVERY_DISPATCHED` genera una `ClienteHouse` en el store.
  Las casas aparecen con scale animation, se "apagan" (gris) al `DELIVERED`,
  y desaparecen al `DELIVERY_RETURNED`. Distribuidas automáticamente en la zona.

- [x] **Sistema de posiciones en Zustand (`agentActions`)**
  → Nuevo estado `agentActions` + `deliveryHouses` + `comandaFlying` en el store.
  `useWebSocket` mapea cada evento a cambios de posición/acción de los agentes.

- [x] **Sonidos chiptune mejorados (Web Audio API)**
  → Síntesis tipo Game Boy/NES: `arpeggio()` para victorias, `fanfare()` para pagos,
  `defeat()` para entregas gratis, `motorSound()` para el delivery. Cada evento tiene
  su propio "voice" (square/sawtooth/triangle) y secuencia de notas.

- [x] **Documentación técnica completa**
  → `docs/data-model.md`: schema PostgreSQL, Redis keys, flujo completo de datos.
  → `docs/integrations.md`: Google Gemini, Groq, LangGraph, WebSocket, Docker.
  → `docs/security.md`: estado actual de seguridad + checklist para producción.

---

## Fase 7 — Realtime Sim Visualization + In-Sim Control Panel 🚧

- [x] **`posX` en agentActions — movimiento horizontal de todos los agentes**
  → Manager y Chef ahora tienen `posX` (% dentro de su zona) en el store. Delivery
  ya lo tenía pero sin usar. El patrón de 3 capas (position → idle-bob → event-flash)
  permite que el bob infinito nunca se interrumpa mientras el robot cambia de estación.

- [x] **Waypoints por zona (`waypoints.js`)**
  → Constante central `WP` con posiciones de cada estación: `manager.phone=18`,
  `manager.comanda_drop=82`, `chef.oven=62`, etc. Separar los números en un archivo
  facilita ajustar posiciones sin tocar la lógica de los componentes.

- [x] **`useWebSocket.js` — event → posX mapping**
  → Cada evento del backend mueve el robot a la estación correspondiente:
  ORDER_CREATED→teléfono, COMANDA_SENT→borde Chef, PIZZA_COOKING→horno,
  PIZZA_PACKED→shelf, PAYMENT→caja registradora. Los timeouts devuelven
  el robot al idle después de completar la acción.

- [x] **ManagerZone y ChefZone — 3 capas de motion + activity indicators**
  → El movimiento horizontal (posX) es la capa externa; el idle-bob
  es la capa media (siempre corriendo); el event-flash es la capa interna
  (key=animKey). Los iconos de actividad (📞 🔥 📦 💰) aparecen encima del
  robot cuando está en cada estación.

- [x] **DeliveryZone — casas con posición absoluta sincronizada**
  → Las casas cambiaron de flex layout a `position: absolute` con `left: HOUSE_POSITIONS[i]%`.
  Esto sincroniza exactamente la posición del robot con la casa a la que llega.
  HOUSE_POSITIONS = [30, 50, 68] % coincide con WP.delivery.house_0/1/2.

- [x] **SimPanel — panel de control inline con 3 tabs**
  → Tab VELOCIDAD: slider 0.5x–10x + botones preset. Tab REGLAS: grid 2 cols
  con sliders para todas las reglas de producción (oven_capacity, pizzas/viaje,
  SLA, limpieza, cola, espera chef, cocción, auto-pedidos). Tab TIEMPO: toggle
  SEG/MIN/HR para el reloj. Todos los cambios persisten al backend via PUT /config.

- [x] **SimClock — timeUnit aware**
  → Formatea el tiempo de simulación según la preferencia: MM:SS (seg), Nm Xs (min),
  Nh Mm (hr). La unidad se guarda en localStorage y en el store.

- [x] **Backend: 3 nuevos campos en SimConfig**
  → `oven_capacity` (máx pizzas simultáneas), `cooking_time_sim_seconds` (tiempo
  de cocción configurable), `comanda_queue_size` (máx cola del chef).
  Razón enforcement: los sliders de UI sin efecto real pierden su valor educativo.

- [x] **Backend: enforcement de oven_capacity en SimRunner**
  → `process_order()` espera antes de procesar si `_active_orders >= oven_capacity`.
  Con `oven_capacity=1` y 2 pedidos, el segundo espera visiblemente hasta que el
  primero pasa a IN_DELIVERY.

- [x] **Backend: cooking_time_sim_seconds en nodo cook**
  → `asyncio.sleep(cooking_time / speed_multiplier)` entre PIZZA_COOKING y PIZZA_BAKED.
  El tiempo se adapta a la velocidad del simulador — a 2x speed, 30s se convierten en 15s reales.
