"""
Smart Search Router
-------------------
Semantic product search using TF-IDF + cosine similarity.
Returns ranked results with relevance scores.
"""

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from typing import List, Optional
import math
import re
from collections import defaultdict

router = APIRouter()

# ── Mini product corpus (replace with DB fetch in production) ─────────────────
PRODUCTS = [
    {"id": 1,  "name": "Pro Wireless Headphones",  "description": "premium audio wireless bluetooth noise cancelling", "category": "Electronics",  "price": 149.99},
    {"id": 2,  "name": "Ergonomic Office Chair",   "description": "comfortable lumbar support adjustable height office", "category": "Furniture",    "price": 389.00},
    {"id": 3,  "name": "Stainless Steel Bottle",   "description": "insulated water bottle stainless steel 32oz eco", "category": "Lifestyle",    "price": 34.99},
    {"id": 4,  "name": "Mechanical Gaming Keyboard","description": "mechanical keyboard rgb gaming switches clicky",   "category": "Electronics",  "price": 129.99},
    {"id": 5,  "name": "Premium Yoga Mat",         "description": "non-slip yoga mat premium thick exercise fitness", "category": "Sports",       "price": 59.99},
    {"id": 6,  "name": "Smart Coffee Maker",       "description": "programmable coffee maker espresso smart brew",    "category": "Kitchen",      "price": 219.00},
    {"id": 7,  "name": "Running Shoes Air Max",    "description": "running shoes breathable cushioned sport athletic","category": "Sports",       "price": 99.99},
    {"id": 8,  "name": "LED Smart Desk Lamp",      "description": "led lamp dimmable usb charging desk light smart",  "category": "Electronics",  "price": 79.99},
    {"id": 9,  "name": "Resistance Bands Set",     "description": "resistance bands exercise workout fitness gym",    "category": "Sports",       "price": 29.99},
    {"id": 10, "name": "Instant Pot Duo",          "description": "pressure cooker instant pot multi cooker kitchen","category": "Kitchen",      "price": 149.99},
    {"id": 11, "name": "Adjustable Laptop Stand",  "description": "laptop stand ergonomic adjustable aluminium desk", "category": "Electronics",  "price": 49.99},
    {"id": 12, "name": "Foam Roller",              "description": "foam roller massage muscle recovery deep tissue",  "category": "Sports",       "price": 24.99},
]

# ── TF-IDF ────────────────────────────────────────────────────────────────────

def tokenise(text: str) -> List[str]:
    return re.findall(r'\b[a-z]{2,}\b', text.lower())

def build_index(products):
    tf_index  = {}    # doc_id → {term: tf}
    df_counts = defaultdict(int)

    for p in products:
        doc   = f"{p['name']} {p['description']} {p['category']}"
        terms = tokenise(doc)
        freq  = defaultdict(int)
        for t in terms:
            freq[t] += 1
        tf  = {t: c / len(terms) for t, c in freq.items()}
        tf_index[p["id"]] = tf
        for t in freq:
            df_counts[t] += 1
    return tf_index, df_counts

def tfidf_score(query: str, doc_id: int, tf_index, df_counts, n_docs) -> float:
    terms = tokenise(query)
    score = 0.0
    tf    = tf_index.get(doc_id, {})
    for term in terms:
        if term in tf:
            idf    = math.log((n_docs + 1) / (df_counts.get(term, 0) + 1)) + 1
            score += tf[term] * idf
    return score


# Pre-build index at import time
_tf_index, _df_counts = build_index(PRODUCTS)
_n_docs = len(PRODUCTS)


# ── Schemas ───────────────────────────────────────────────────────────────────
class SearchResult(BaseModel):
    id:        int
    name:      str
    category:  str
    price:     float
    score:     float


class SearchResponse(BaseModel):
    query:   str
    results: List[SearchResult]
    total:   int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/search", response_model=SearchResponse)
async def smart_search(
    q:     str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50),
):
    scored = []
    for p in PRODUCTS:
        score = tfidf_score(q, p["id"], _tf_index, _df_counts, _n_docs)
        if score > 0:
            scored.append(SearchResult(
                id=p["id"], name=p["name"],
                category=p["category"], price=p["price"],
                score=round(score, 4),
            ))

    scored.sort(key=lambda x: x.score, reverse=True)
    return SearchResponse(query=q, results=scored[:limit], total=len(scored))


@router.get("/suggestions")
async def suggestions(
    q:     str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=10),
):
    """Autocomplete suggestions based on product names."""
    q_lower   = q.lower()
    matches   = [
        {"id": p["id"], "label": p["name"], "category": p["category"]}
        for p in PRODUCTS
        if q_lower in p["name"].lower() or q_lower in p["description"]
    ]
    return {"query": q, "suggestions": matches[:limit]}
