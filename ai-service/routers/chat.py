"""
AI Chatbot Router
-----------------
Handles conversational AI using OpenAI (or Groq as a free alternative).
Falls back to rule-based responses if AI API is unavailable.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx

router = APIRouter()


class ChatMessage(BaseModel):
    role: str      # "user" | "bot"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply:        str
    intent:       Optional[str] = None
    suggestions:  Optional[List[str]] = None


# ── Rule-based fallback ───────────────────────────────────────────────────────
RULE_RESPONSES = {
    ("track", "order", "where"):
        ("track_order",
         "To track your order, go to **My Orders** and click **Track** on any order. "
         "You can also enter your order ID in the tracking page directly.",
         ["View my orders", "Enter tracking number"]),

    ("return", "refund", "exchange"):
        ("return_policy",
         "Our **30-day return policy** lets you return any unused item in original packaging. "
         "Start a return from **My Orders → Return Item**.",
         ["Start a return", "Contact support"]),

    ("discount", "coupon", "promo", "deal", "offer"):
        ("promotions",
         "🔖 Current promotions: **SAVE20** (20% off), **FREESHIP** (free shipping on any order). "
         "Check the Deals page for more!",
         ["Browse deals", "Apply coupon"]),

    ("recommend", "suggest", "best", "popular"):
        ("recommendations",
         "I'd be happy to recommend products! 🛍️ Based on trending items, check out our "
         "**Best Sellers** section. Or tell me what category you're interested in.",
         ["Electronics", "Sports & Fitness", "Kitchen"]),

    ("payment", "pay", "checkout", "card"):
        ("payment_info",
         "We accept **Credit/Debit Cards**, **UPI**, **Net Banking**, and **Wallets**. "
         "All payments are secured with 256-bit SSL encryption.",
         ["Proceed to checkout", "Payment methods"]),

    ("shipping", "delivery", "deliver"):
        ("shipping_info",
         "**Standard delivery**: 5-7 days (free on orders over $50) · "
         "**Express**: 2-3 days ($9.99) · **Overnight**: Next day ($24.99)",
         ["Track my order", "Checkout"]),
}


def rule_based_reply(message: str):
    msg = message.lower()
    for keywords, (intent, reply, suggestions) in RULE_RESPONSES.items():
        if any(kw in msg for kw in keywords):
            return intent, reply, suggestions
    return (
        "general",
        "I'm here to help with product questions, orders, returns, and more. "
        "What can I assist you with today? 😊",
        ["Track order", "Returns policy", "Best deals", "Product help"],
    )


# ── AI-powered reply (OpenAI / Groq) ─────────────────────────────────────────
SYSTEM_PROMPT = """You are ShopEasy's friendly AI shopping assistant.
You help customers with:
- Finding and recommending products
- Tracking orders and returns
- Shipping and payment questions
- General shopping assistance

Keep responses concise, helpful, and friendly. Use markdown formatting.
Always stay on-topic for an e-commerce platform."""


async def get_ai_reply(message: str, history: List[ChatMessage]) -> str:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("No AI API key configured")

    is_groq = bool(os.getenv("GROQ_API_KEY"))
    base_url = "https://api.groq.com/openai/v1" if is_groq else "https://api.openai.com/v1"
    model    = "mixtral-8x7b-32768" if is_groq else "gpt-3.5-turbo"

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history[-6:]:   # last 3 turns
        messages.append({"role": "user" if h.role == "user" else "assistant", "content": h.content})
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": model, "messages": messages, "max_tokens": 300, "temperature": 0.7},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Try AI first, fall back to rules
        try:
            reply = await get_ai_reply(request.message, request.history or [])
            return ChatResponse(reply=reply, intent="ai_generated")
        except Exception:
            pass   # fall through to rules

        intent, reply, suggestions = rule_based_reply(request.message)
        return ChatResponse(reply=reply, intent=intent, suggestions=suggestions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
