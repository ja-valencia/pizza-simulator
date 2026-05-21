# Pizza Simulator — Modelo de Datos

## Base de datos PostgreSQL

### Tabla `orders`

Registra el ciclo de vida completo de cada pedido.

```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status          VARCHAR NOT NULL DEFAULT 'PENDING',
    items           VARCHAR[] NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sim_time_created FLOAT NOT NULL DEFAULT 0.0,
    is_free         BOOLEAN NOT NULL DEFAULT FALSE
);
```

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del pedido |
| `status` | VARCHAR | Estado actual (ver enum abajo) |
| `items` | VARCHAR[] | Lista de pizzas ordenadas. Ej: `['margarita', 'pepperoni']` |
| `created_at` | TIMESTAMPTZ | Timestamp real de creación |
| `sim_time_created` | FLOAT | Tiempo de simulación en que se creó (segundos) |
| `is_free` | BOOLEAN | True si superó el SLA de entrega |

**Estados posibles (`OrderStatus` enum):**
```
PENDING → ACCEPTED → COOKING → BAKED → PACKED → IN_DELIVERY → DELIVERED → PAID
                                                                          → FREE (si SLA superado)
```

---

### Tabla `events`

Log inmutable de todo lo que ocurre en la simulación. Es el "audit trail" del sistema.

```sql
CREATE TABLE events (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sim_time  FLOAT NOT NULL DEFAULT 0.0,
    type      VARCHAR NOT NULL,
    agent     VARCHAR NOT NULL,
    payload   JSONB NOT NULL DEFAULT '{}'
);
```

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del evento |
| `timestamp` | TIMESTAMPTZ | Timestamp real del evento |
| `sim_time` | FLOAT | Tiempo de simulación del evento (segundos) |
| `type` | VARCHAR | Tipo de evento (ver enum abajo) |
| `agent` | VARCHAR | Agente que generó el evento |
| `payload` | JSONB | Datos del evento (order_id, message, etc.) |

**Tipos de evento (`EventType` enum):**
| Evento | Agente | Descripción |
|--------|--------|-------------|
| `ORDER_CREATED` | cliente | Cliente genera un pedido |
| `ORDER_ACCEPTED` | manager | Manager acepta el pedido |
| `COMANDA_SENT` | manager | Manager envía comanda a cocina |
| `PIZZA_COOKING` | chef | Chef mete pizzas al horno |
| `PIZZA_BAKED` | chef | Pizzas listas del horno |
| `PIZZA_PACKED` | chef | Pizzas empacadas para delivery |
| `STATION_CLEANING` | chef | Chef limpia la estación |
| `DELIVERY_DISPATCHED` | delivery | Delivery sale con pedido |
| `DELIVERED` | delivery | Delivery entrega al cliente |
| `PAYMENT_RECEIVED` | manager | Pago recibido |
| `PAYMENT_FREE` | manager | Entrega gratis por SLA |
| `DELIVERY_RETURNED` | delivery | Delivery regresa a la pizzería |

---

## Redis — Estado en tiempo real

Redis almacena el estado volátil que cambia constantemente y no necesita persistencia histórica.

| Key | Tipo | Descripción |
|-----|------|-------------|
| `sim:config` | String (JSON) | SimConfig serializado. Fuente de verdad de las reglas de negocio |
| `sim:clock:time` | String (float) | Tiempo actual de simulación en segundos |
| `sim:clock:running` | String ("0"/"1") | Si el reloj está corriendo |

**SimConfig schema (JSON en Redis):**
```json
{
  "max_delivery_capacity": 5,
  "station_clean_every_n_pizzas": 10,
  "station_clean_every_minutes": 30.0,
  "chef_batch_wait_seconds": 30.0,
  "free_delivery_after_minutes": 45.0,
  "sim_speed_multiplier": 1.0,
  "auto_order_enabled": false,
  "auto_order_interval_seconds": 10.0
}
```

---

## LangGraph — PizzaState (TypedDict)

Estado compartido entre nodos del grafo LangGraph durante el procesamiento de un pedido.

```python
class PizzaState(TypedDict):
    order_id: str                # UUID del pedido en PostgreSQL
    items: list[str]             # Pizzas del pedido
    status: str                  # OrderStatus value actual
    sim_time_created: float      # sim_time al crear el pedido
    current_sim_time: float      # sim_time actual al ejecutar el nodo
    agent_messages: list[dict]   # narrativa: [{"agent": "chef", "message": "..."}]
    is_free: bool                # si la entrega es gratis
    batch_wait_start: float      # sim_time en que chef empezó a esperar batch
    delivery_load: int           # pizzas que carga delivery actualmente
    pizzas_since_clean: int      # pizzas horneadas desde última limpieza
    minutes_since_clean: float   # minutos de sim desde última limpieza
```

---

## Flujo de datos completo

```
Cliente (Groq) 
  → genera items[]
  → POST /orders o auto
  → crea OrderRow (PostgreSQL, status=PENDING)
  → publica ORDER_CREATED (EventRow + WebSocket)
  
Manager (Gemini)
  → acepta pedido
  → update OrderRow (status=ACCEPTED)
  → publica ORDER_ACCEPTED + COMANDA_SENT
  
Chef (Gemini)
  → verifica limpieza (BusinessRulesEngine)
  → hornea + empaca
  → update OrderRow (status=COOKING→BAKED→PACKED)
  → publica PIZZA_COOKING + PIZZA_BAKED + PIZZA_PACKED
  
Delivery (Groq)
  → verifica capacidad (BusinessRulesEngine)
  → entrega
  → verifica SLA → is_free (BusinessRulesEngine)
  → update OrderRow (status=IN_DELIVERY→DELIVERED, is_free=?)
  → publica DELIVERY_DISPATCHED + DELIVERED
  
Manager (Gemini)
  → recibe pago / marca gratis
  → update OrderRow (status=PAID|FREE)
  → publica PAYMENT_RECEIVED|PAYMENT_FREE + DELIVERY_RETURNED

WebSocket
  → broadcast de cada evento al frontend en tiempo real
  → frontend actualiza Zustand store → React re-render
```
