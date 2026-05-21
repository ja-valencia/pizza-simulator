from langchain_groq import ChatGroq

from app.config import settings

_llm: ChatGroq | None = None


def get_chef_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=settings.groq_api_key,
            temperature=0.6,
        )
    return _llm


async def chef_narrate(action: str, context: dict) -> str:
    """El Chef genera una frase narrativa sobre su acción."""
    llm = get_chef_llm()
    prompt = (
        f"Eres el Chef de una pizzería. En una frase corta y natural, describe esta acción: '{action}'. "
        f"Contexto: pizzas: {context.get('items', [])}. "
        f"Responde solo con la frase, sin comillas."
    )
    response = await llm.ainvoke(prompt)
    return response.content.strip()
