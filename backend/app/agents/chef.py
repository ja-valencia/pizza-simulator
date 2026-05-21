from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings

# Chef usa Gemini 2.0 Flash:
# Razón: el Chef necesita seguir instrucciones precisas (recetas, tiempos, orden de operaciones).
# Gemini Flash es más consistente que Groq 8b para seguimiento de instrucciones complejas.
# Mismo modelo que Manager para simplificar el setup — misma API key, mismo rate limit compartido.
_llm: ChatGoogleGenerativeAI | None = None


def get_chef_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.google_api_key,
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
