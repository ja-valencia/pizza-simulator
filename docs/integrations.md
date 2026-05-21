# Pizza Simulator — Integraciones

## Google Gemini API

**Usada por:** Manager Agent, Chef Agent  
**Modelo:** `gemini-2.0-flash`  
**SDK:** `langchain-google-genai` vía LangChain

### Configuración
```bash
# .env
GOOGLE_API_KEY=tu_api_key_aqui
```
Obtener en: https://aistudio.google.com/apikey

### Rate limits (Free Tier)
| Límite | Valor |
|--------|-------|
| Requests por minuto (RPM) | 15 |
| Tokens por minuto (TPM) | 1,000,000 |
| Requests por día (RPD) | 1,500 |

**⚠️ Lección aprendida:** Con auto-pedidos a 0.3 de probabilidad cada 2.5s, se generaron ~50 requests en 20s agotando el RPM. Solución: `auto_order_enabled: false` por defecto, y procesar pedidos de a uno.

### Para habilitar billing (sin límites de free tier)
1. Ve a https://console.cloud.google.com
2. Habilita billing en tu proyecto
3. Los costos son ~$0.000075 por 1K tokens de input con `gemini-2.0-flash`
4. Un pedido completo ≈ 7 llamadas × ~100 tokens = ~$0.00005 por pedido

---

## Groq API

**Usada por:** Delivery Agent, Cliente Agent  
**Modelos:** `llama-3.3-70b-versatile` (Delivery), `llama-3.1-8b-instant` (Cliente)  
**SDK:** `langchain-groq` vía LangChain

### Configuración
```bash
# .env
GROQ_API_KEY=tu_api_key_aqui
```
Obtener en: https://console.groq.com

### Rate limits (Free Tier — muy generosos)
| Límite | Modelo | Valor |
|--------|--------|-------|
| RPM | llama-3.3-70b | 30 |
| RPM | llama-3.1-8b | 30 |
| TPM | ambos | 6,000 tokens |
| RPD | ambos | sin límite documentado |

**Por qué Groq para Delivery y Cliente:**
- Latencia ~100ms vs ~800ms de Gemini
- Rate limits más generosos en free tier
- Decisiones simples no requieren el razonamiento de Gemini

---

## LangGraph

**Versión:** `langgraph==1.2.0`  
**Uso:** Modela el ciclo de vida de un pedido como grafo de estados

### Patrón usado: StateGraph con TypedDict
```python
from langgraph.graph import StateGraph, END

graph = StateGraph(PizzaState)
graph.add_node("accept_order", accept_order)
graph.add_node("check_batch", check_batch)
# ... más nodos
graph.add_conditional_edges("check_batch", route_batch, {...})
compiled = graph.compile()
await compiled.ainvoke(initial_state)
```

### Cómo extender el grafo
Para agregar un nuevo paso al workflow:
1. Crear una función `async def nuevo_paso(state, session, event_bus)` en `graph.py`
2. `graph.add_node("nuevo_paso", wrap(nuevo_paso))`
3. Conectar con `add_edge` o `add_conditional_edges`
4. El estado `PizzaState` en `state.py` puede necesitar nuevos campos

### Archivos clave
- `backend/app/agents/graph.py` — Definición del grafo y nodos
- `backend/app/agents/state.py` — PizzaState TypedDict
- `backend/app/agents/runner.py` — SimRunner que invoca el grafo

---

## WebSocket (FastAPI nativo)

**Endpoint:** `ws://localhost:8000/ws`  
**En frontend:** proxied por Vite como `ws://localhost:5173/ws`

### Protocolo de mensajes

Todos los mensajes son JSON con al menos `type` y `payload`:

```json
{
  "type": "EVENT_TYPE",
  "payload": {},
  "agent": "manager|chef|delivery|cliente|system",
  "sim_time": 42.5
}
```

### Eventos del servidor → cliente

| Tipo | Cuándo | Payload |
|------|--------|---------|
| `CONNECTED` | Al conectar | SimConfig actual |
| `CLOCK_TICK` | Cada 0.5s | `{sim_time, running, speed}` |
| `CONFIG_UPDATED` | Al cambiar config | SimConfig nuevo |
| `ORDER_CREATED` | Nuevo pedido | `{order_id, items, message}` |
| `ORDER_ACCEPTED` | Manager acepta | `{order_id, message}` |
| `COMANDA_SENT` | Manager a Chef | `{order_id, message}` |
| `PIZZA_COOKING` | Chef hornea | `{order_id, items, message}` |
| `PIZZA_BAKED` | Pizzas listas | `{order_id, message}` |
| `PIZZA_PACKED` | Pizzas empacadas | `{order_id, message}` |
| `STATION_CLEANING` | Chef limpia | `{message}` |
| `DELIVERY_DISPATCHED` | Sale delivery | `{order_id, items, message}` |
| `DELIVERED` | Entregado | `{order_id, is_free, message}` |
| `PAYMENT_RECEIVED` | Pago recibido | `{order_id, is_free, message}` |
| `PAYMENT_FREE` | Gratis | `{order_id, is_free, message}` |
| `DELIVERY_RETURNED` | Delivery regresa | `{order_id}` |

### Reconexión automática (frontend)
El `useWebSocket` hook en `frontend/src/hooks/useWebSocket.js` reconecta cada 3s en `ws.onclose`.

---

## Docker Compose

**Servicios:**
- `redis:7-alpine` en puerto `6379`
- `postgres:16-alpine` en puerto `5432`

**Base de datos:** `pizza_simulator` / user: `pizza` / pass: `pizza123`

### Comandos útiles
```bash
docker-compose up -d          # Levantar en background
docker-compose down           # Detener y borrar contenedores
docker-compose ps             # Ver estado
docker-compose logs redis     # Logs de Redis
docker-compose exec postgres psql -U pizza pizza_simulator  # Shell SQL
```
