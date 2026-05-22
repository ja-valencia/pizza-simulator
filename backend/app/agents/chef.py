import asyncio
import logging

from langchain_groq import ChatGroq

from app.config import settings

logger = logging.getLogger(__name__)

# Chef usa Groq llama-3.3-70b — sin límite diario, 30 RPM, latencia ~100ms.
# Cambiado de Gemini 2.0 Flash (15 RPM, 1500/día) para evitar bloqueos por quota.
_llm: ChatGroq | None = None


def get_chef_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=settings.groq_api_key,
            temperature=0.6,
            request_timeout=30,
        )
    return _llm


async def chef_narrate(action: str, context: dict) -> str:
    """El Chef genera una frase narrativa. Retry 3x con backoff para resistir fallos de quota."""
    llm = get_chef_llm()
    prompt = (
        f"Eres el Chef de una pizzería. En una frase corta y natural, describe esta acción: '{action}'. "
        f"Contexto: pizzas: {context.get('items', [])}. "
        f"Responde solo con la frase, sin comillas."
    )
    for attempt in range(3):
        try:
            response = await llm.ainvoke(prompt)
            return response.content.strip()
        except Exception as e:
            if attempt == 2:
                logger.warning(f"[Chef] LLM falló 3 veces ({e}). Usando fallback.")
                return f"[Chef] {action}"
            await asyncio.sleep(2 ** attempt)
    return f"[Chef] {action}"
