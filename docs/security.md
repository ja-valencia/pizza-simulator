# Pizza Simulator — Seguridad

> Este es un proyecto de aprendizaje local. Las notas de seguridad documentan
> qué está configurado para desarrollo y qué cambiar antes de exponer en producción.

---

## API Keys

### Estado actual ✅
- Las API keys viven en `backend/.env` (no en código)
- `.env` está en `.gitignore` — nunca se sube al repo
- `.env.example` muestra la estructura sin valores reales

### ⚠️ Problema conocido
Las API keys fueron compartidas en el chat de Claude Code durante una sesión de desarrollo.
**Acción requerida:** Regenerar ambas keys:
- Google: https://aistudio.google.com → tu proyecto → "Regenerar key"
- Groq: https://console.groq.com → API Keys → "Revocar y crear nueva"

### Para producción
```python
# Usar variables de entorno del sistema, no archivo .env
import os
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")  # nunca hardcodeado
```
O usar un gestor de secretos: AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault.

---

## CORS

### Estado actual ⚠️ (solo para desarrollo)
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ← ABIERTO PARA DEV
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Para producción
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tu-dominio.com"],  # solo tu frontend
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)
```

---

## Autenticación

### Estado actual ⚠️
No hay autenticación. Cualquier cliente puede:
- Crear pedidos (`POST /orders`)
- Modificar la configuración (`PUT /config`)
- Ver todas las órdenes (`GET /orders`)

### Para producción
Opciones en orden de complejidad:
1. **API Key simple:** Header `X-API-Key` verificado en un middleware
2. **JWT tokens:** Librería `python-jose` o `authlib`
3. **OAuth2:** Integrar con Google/GitHub via `fastapi-users`

```python
# Ejemplo de middleware de API Key simple
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

API_KEY = os.environ.get("PIZZA_API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(key: str = Security(api_key_header)):
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="API key inválida")
```

---

## Rate Limiting

### Estado actual ⚠️
No hay rate limiting en los endpoints del backend. Un cliente malicioso podría:
- Crear miles de pedidos → llenar la DB
- Spamear `PUT /config` → interrumpir la simulación
- Agotar la cuota de los LLMs

### Para producción
```python
# Con slowapi (compatible con FastAPI)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/orders")
@limiter.limit("10/minute")
async def create_order(...):
    ...
```

---

## Base de datos

### Estado actual ⚠️
- Credenciales hardcodeadas en `docker-compose.yml` (`pizza`/`pizza123`)
- Sin cifrado en tránsito (SSL deshabilitado)
- Sin backups automáticos

### Para producción
- Usar variables de entorno para credenciales
- Habilitar SSL en PostgreSQL (`sslmode=require` en `DATABASE_URL`)
- Configurar backups automáticos (pg_dump + S3 o similar)
- Usar connection pooling (PgBouncer) para alta concurrencia

---

## WebSockets

### Estado actual ✅
- El endpoint `/ws` no requiere autenticación (correcto para desarrollo)
- No hay validación de mensajes entrantes del cliente

### Para producción
```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    # Verificar token antes de aceptar la conexión
    if not verify_token(token):
        await websocket.close(code=4001)
        return
    await ws_manager.connect(websocket)
    ...
```

---

## Resumen de acciones para producción

| Área | Prioridad | Acción |
|------|-----------|--------|
| API Keys | 🔴 Alta | Regenerar keys comprometidas |
| CORS | 🔴 Alta | Restringir a dominio específico |
| Autenticación | 🟡 Media | Agregar API Key o JWT |
| Rate Limiting | 🟡 Media | Instalar slowapi |
| DB Credentials | 🟡 Media | Mover a variables de entorno |
| WebSocket Auth | 🟢 Baja | Token en query param |
