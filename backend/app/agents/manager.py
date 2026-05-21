from langchain_groq import ChatGroq

from app.config import settings

_llm: ChatGroq | None = None


def get_manager_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=settings.groq_api_key,
            temperature=0.7,
        )
    return _llm


async def manager_narrate(action: str, context: dict) -> str:
    """El Manager genera una frase narrativa sobre su acción."""
    llm = get_manager_llm()
    prompt = (
        f"Eres el Manager de una pizzería. En una frase corta y natural, describe esta acción: '{action}'. "
        f"Contexto: pedido #{context.get('order_id', '')[:8]}, items: {context.get('items', [])}. "
        f"Responde solo con la frase, sin comillas."
    )
    response = await llm.ainvoke(prompt)
    return response.content.strip()
