import asyncio
import logging
import random

from langchain_groq import ChatGroq

from app.config import settings

logger = logging.getLogger(__name__)

# Cliente usa Groq llama-3.1-8b — más rápido y económico para narrativa simple.
_llm: ChatGroq | None = None

PIZZA_MENU = ["margarita", "pepperoni", "hawaiana", "cuatro quesos", "vegetariana", "bbq pollo"]


def get_cliente_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=settings.groq_api_key,
            temperature=0.9,
            request_timeout=30,
        )
    return _llm


async def generate_order() -> list[str]:
    """El Cliente genera un pedido aleatorio."""
    n = random.randint(1, 3)
    return random.choices(PIZZA_MENU, k=n)


async def cliente_narrate(items: list[str]) -> str:
    """El Cliente genera una frase pidiendo su orden. Retry 3x para resistir fallos."""
    llm = get_cliente_llm()
    prompt = (
        f"Eres un cliente hambriento llamando a una pizzería. "
        f"En una frase corta y natural pide estas pizzas: {items}. "
        f"Responde solo con la frase, sin comillas."
    )
    for attempt in range(3):
        try:
            response = await llm.ainvoke(prompt)
            return response.content.strip()
        except Exception as e:
            if attempt == 2:
                logger.warning(f"[Cliente] LLM falló 3 veces ({e}). Usando fallback.")
                return f"Quiero {', '.join(items)} por favor."
            await asyncio.sleep(2 ** attempt)
    return f"Quiero {', '.join(items)} por favor."
