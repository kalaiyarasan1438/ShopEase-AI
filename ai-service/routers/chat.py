"""
ShopEasy AI Chat Router
=======================
FastAPI endpoints for natural language shopping assistant:
- Intent and entity extraction
- General Q&A knowledge engine
- Product comparison logic
- Strict response formatting
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
import os

router = APIRouter()


class ChatMessage(BaseModel):
    role: str       # "user" | "bot" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    image: Optional[str] = None       # Base64 or image URL if attached


class ChatResponse(BaseModel):
    reply: str
    intent: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None


# ── General Q&A Knowledge Engine ─────────────────────────────────────────────
GENERAL_KNOWLEDGE = [
    {
        "keywords": ["oled", "display", "screen type"],
        "answer": (
            "An **OLED** (Organic Light-Emitting Diode) display uses self-lit pixels "
            "where each pixel turns on and off individually. This produces true, deep blacks, "
            "infinite contrast ratio, vibrant colors, and ultra-fast response times compared to LCD screens."
        )
    },
    {
        "keywords": ["amoled", "super amoled"],
        "answer": (
            "**AMOLED** (Active-Matrix Organic Light-Emitting Diode) is an advanced type of OLED display "
            "that incorporates a thin-film transistor (TFT) layer for faster pixel switching, lower power consumption, "
            "and higher pixel density—commonly used in modern flagship smartphones."
        )
    },
    {
        "keywords": ["ram", "memory"],
        "answer": (
            "**RAM** (Random Access Memory) is system short-term memory that stores data currently being used by "
            "the OS and active applications. More RAM allows smoother multitasking, faster switching between apps, "
            "and better performance in demanding programs like video editing or gaming."
        )
    },
    {
        "keywords": ["choose a laptop", "buying advice laptop", "laptop guide"],
        "answer": (
            "💡 **Key Factors When Choosing a Laptop**:\n"
            "1. **Processor (CPU)**: Intel Core i5/i7 (12th+ Gen) or AMD Ryzen 5/7 for performance.\n"
            "2. **RAM**: Minimum 16GB for programming, multitasking, or heavy workloads.\n"
            "3. **Storage**: At least 512GB NVMe SSD.\n"
            "4. **Display**: Full HD IPS or OLED screen with 300+ nits brightness.\n"
            "5. **Battery**: 8+ hours battery life for portability."
        )
    },
    {
        "keywords": ["return", "refund", "exchange"],
        "answer": (
            "📦 **Return Policy**: ShopEasy offers a 30-day hassle-free return window for unused products "
            "in original packaging. You can initiate a return directly from **My Account → Orders → Return**."
        )
    },
    {
        "keywords": ["payment", "pay", "upi", "cod"],
        "answer": (
            "💳 **Payment Options**: We support Credit/Debit Cards, UPI (PhonePe, Google Pay, Paytm), "
            "Net Banking, and Cash on Delivery (COD). All online payments are secured by 256-bit SSL encryption."
        )
    }
]


def extract_shopping_intent(text: str) -> Dict[str, Any]:
    """Parses intent, category, brand, model, budget, color, and use-case from user input."""
    raw = text.lower().strip()

    # Category Detection
    category = None
    item_type = None

    if re.search(r'\b(shampoo|shampoos|haircare|hair care|conditioner|hair oil)\b', raw):
        category = "Hair & Care"
        item_type = "shampoo"
    elif re.search(r'\b(serum|serums|face serum)\b', raw):
        category = "Beauty & Care"
        item_type = "serum"
    elif re.search(r'\b(shirt|shirts|t-shirt|tshirt|polo)\b', raw):
        category = "Fashion"
        item_type = "shirt"
    elif re.search(r'\b(cricket\s*bats?|bats?)\b', raw):
        category = "Sports"
        item_type = "cricket_bat"
    elif re.search(r'\b(phone|mobiles?|smartphones?|iphone|galaxy|android)\b', raw):
        category = "Electronics"
        item_type = "phone"
    elif re.search(r'\b(laptops?|macbook|notebooks?|computers?)\b', raw):
        category = "Electronics"
        item_type = "laptop"
    elif re.search(r'\b(headphones?|earphones?|earbuds?|headsets?|audio|speakers?)\b', raw):
        category = "Electronics"
        item_type = "headphones"
    elif re.search(r'\b(watch|watches|smartwatch|smartwatches|chronograph)\b', raw):
        category = "Electronics"
        item_type = "watch"
    elif re.search(r'\b(shoes?|sneakers?|boots?|footwear)\b', raw):
        category = "Fashion"
        item_type = "shoes"
    elif re.search(r'\b(jhumka|jhumkas|earrings?|necklace|chain|bracelet|jewelry|jewellery)\b', raw):
        category = "Fashion"
        item_type = "jewelry"
    elif re.search(r'\b(books?|novels?)\b', raw):
        category = "Books"
        item_type = "book"
    elif re.search(r'\b(beauty|creams?|skincare|sunscreen|lotion)\b', raw):
        category = "Beauty & Care"
        item_type = "beauty"

    # Brand Detection
    brand = None
    if "iphone" in raw or "apple" in raw or "macbook" in raw:
        brand = "Apple"
    elif "samsung" in raw or "galaxy" in raw:
        brand = "Samsung"
    elif "sony" in raw:
        brand = "Sony"
    elif "nike" in raw:
        brand = "Nike"
    elif "adidas" in raw:
        brand = "Adidas"
    elif "dell" in raw:
        brand = "Dell"
    elif "hp" in raw:
        brand = "HP"
    elif "lenovo" in raw:
        brand = "Lenovo"

    # Model Detection
    model = None
    m_iphone = re.search(r'iphone\s*(\d+\s*(?:pro\s*max|pro|plus)?)', raw)
    m_galaxy = re.search(r'galaxy\s*([a-z0-9]+)', raw)
    m_macbook = re.search(r'macbook\s*(?:air|pro)?(?:\s*m\d)?', raw)

    if m_iphone:
        model = m_iphone.group(0).title()
    elif m_galaxy:
        model = m_galaxy.group(0).title()
    elif m_macbook:
        model = m_macbook.group(0).title()

    # Budget Extraction
    max_price = None
    min_price = None

    clean_raw = re.sub(r'[\.,!\?"\'\(\):;\/\-_]', ' ', raw)
    range_match = re.search(r'(?:from\s*)?(?:₹|rs\.?|inr|\$)?\s*(\d+(?:\.\d+)?)\s*k?\s*(?:to|-|and)\s*(?:₹|rs\.?|inr|\$)?\s*(\d+(?:\.\d+)?)\s*k?', clean_raw)
    if range_match:
        p1 = float(range_match.group(1))
        p2 = float(range_match.group(2))
        if p1 < 1000 and 'k' in range_match.group(0): p1 *= 1000
        if p2 < 1000 and 'k' in range_match.group(0): p2 *= 1000
        min_price = min(p1, p2)
        max_price = max(p1, p2)
    else:
        k_match = re.search(r'(?:under|below|around|approx|budget|with|for|of|less than|within|upto|up to|max)?\s*(?:₹|rs\.?|inr|\$)?\s*(\d+(?:\.\d+)?)\s*k\b', clean_raw)
        lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|l)\b', clean_raw)
        budget_match = re.search(r'(?:under|below|less than|within|upto|up to|max|budget|around|approx|with|for|of)\s*(?:₹|rs\.?|inr|\$)?\s*(\d{2,6})\b', clean_raw)
        symbol_match = re.search(r'(?:₹|rs\.?|inr)\s*(\d{2,6})\b', raw)

        if k_match:
            max_price = float(k_match.group(1)) * 1000
        elif lakh_match:
            max_price = float(lakh_match.group(1)) * 100000
        elif budget_match:
            max_price = float(budget_match.group(1))
        elif symbol_match:
            max_price = float(symbol_match.group(1))

    # Color
    colors = ["black", "white", "blue", "red", "green", "gold", "silver", "grey", "purple", "pink"]
    color = next((c for c in colors if c in raw), None)

    # Use Case
    use_case = None
    if any(w in raw for w in ["program", "code", "developer", "coding"]): use_case = "Programming"
    elif any(w in raw for w in ["game", "gaming", "playstation"]): use_case = "Gaming"
    elif any(w in raw for w in ["camera", "photo", "photography"]): use_case = "Camera"
    elif any(w in raw for w in ["battery", "backup"]): use_case = "Battery"

    is_comparison = "compare" in raw or "which one is better" in raw or "difference" in raw
    is_feature_query = any(w in raw for w in ["feature", "spec", "detail", "tell me about", "what is special"])

    return {
        "category": category,
        "item_type": item_type,
        "brand": brand,
        "model": model,
        "max_price": max_price,
        "min_price": min_price,
        "color": color,
        "use_case": use_case,
        "is_comparison": is_comparison,
        "is_feature_query": is_feature_query,
        "raw_query": text
    }


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    text_lower = request.message.lower().strip()

    # 1. General Knowledge Query Match
    for qa in GENERAL_KNOWLEDGE:
        if any(kw in text_lower for kw in qa["keywords"]):
            return ChatResponse(
                reply=qa["answer"],
                intent={"type": "general_qa"},
                suggestions=["Laptop guide", "Return policy", "Payment options"]
            )

    # 2. Extract Intent & Entities
    intent_data = extract_shopping_intent(request.message)

    return ChatResponse(
        reply=f"Parsed intent for query: {intent_data.get('item_type') or 'general'}",
        intent=intent_data,
        suggestions=["Recommend products", "Track my order"]
    )
