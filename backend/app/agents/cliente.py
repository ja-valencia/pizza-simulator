import random

from langchain_groq import ChatGroq

from app.config import settings

_llm: ChatGroq | None = None

PIZZA_MENU = ["margarita", "pepperoni", "hawaiana", "cuatro quesos", "vegetariana", "bbq pollo"]


def get_cliente_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=settings.groq_api_key,
            temperature=0.9,
        )
    return _llm


async def generate_order() -> list[str]:
    """El Cliente genera un pedido aleatorio con narrativa del LLM."""
    n = random.randint(1, 3)
    items = random.choices(PIZZA_MENU, k=n)
    return items


async def cliente_narrate(items: list[str]) -> str:
    """El Cliente genera una frase pidiendo su orden."""
    llm = get_cliente_llm()
    prompt = (
        f"Eres un cliente hambriento llamando a una pizzería. "
        f"En una frase corta y natural pide estas pizzas: {items}. "
        f"Responde solo con la frase, sin comillas."
    )
    response = await llm.ainvoke(prompt)
    return response.content.strip()
