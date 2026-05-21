# Pizza Simulator — Progress Tracker

## Fase 0 — Setup ✅
- [x] Repo limpio (eliminados: skills/, .claude-plugin/, .cursor/skills/)
- [x] CLAUDE.md con guidelines de desarrollo
- [x] .cursor/rules/karpathy-guidelines.mdc para Cursor
- [x] Draw.io MCP configurado (.mcp.json)
- [x] Documentación inicial (docs/)

## Fase 1 — Fundación ✅
- [x] Estructura de carpetas del proyecto (backend/)
- [x] FastAPI app base
- [x] Modelos de datos (Order, SimConfig, Event)
- [x] WebSocket channel
- [x] Redis setup
- [x] PostgreSQL setup + tablas creadas automáticamente
- [x] docker-compose.yml (Redis + PostgreSQL)
- [x] Health endpoint verificado: `{"status":"ok","redis":"ok","postgres":"ok"}`

## Fase 2 — Motor de simulación ✅
- [x] Reloj de simulación (acelerar/frenar) — `sim/clock.py`
- [x] Event bus interno — `sim/event_bus.py`
- [x] Business rules engine (configurable) — `sim/rules.py`
- [x] Endpoints de control: `/sim/start`, `/sim/stop`, `/sim/reset`, `/sim/status`
- [x] Velocidad del reloj se actualiza en tiempo real al cambiar `/config`

## Fase 3 — Agentes con LangGraph ⏳
- [ ] Grafo LangGraph del workflow
- [ ] Manager Agent (Claude)
- [ ] Chef Agent (Gemini)
- [ ] Delivery Agent (Groq)
- [ ] Cliente Agent (Groq)
- [ ] Inter-agent communication

## Fase 4 — Frontend Sim Viewer ⏳
- [ ] Layout de la pizzería
- [ ] Agentes como entidades visuales
- [ ] Animaciones por evento
- [ ] Sonidos por evento

## Fase 5 — Frontend Dashboard ⏳
- [ ] Métricas en tiempo real
- [ ] Panel de control (settings, stress testing)
- [ ] Gráficas históricas

## Fase 6 — Polish ⏳
- [ ] Tuning de reglas
- [ ] Escenarios de estrés
- [ ] UX final
