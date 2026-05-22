import asyncio
import logging

from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings

logger = logging.getLogger(__name__)

# Chef usa Gemini 2.0 Flash — consistencia en instrucciones de cocina.
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
