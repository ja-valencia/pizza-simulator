from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings

# Manager usa Gemini 2.0 Flash:
# Razón: el Manager toma las decisiones más complejas (orquestación, validación de pedidos,
# cierre de transacciones). Gemini Flash ofrece mejor razonamiento que los modelos Groq
# pequeños, a un costo razonable. Se eligió Flash sobre Pro por velocidad/costo en free tier.
_llm: ChatGoogleGenerativeAI | None = None


def get_manager_llm() -> ChatGoogleGenerativeAI:
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.google_api_key,
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
