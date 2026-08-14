"""
ShopEasy AI Service
===================
FastAPI-powered AI microservice providing:
  - AI chatbot with product & order context
  - Collaborative-filtering recommendation engine
  - Semantic smart search with TF-IDF + cosine similarity
  - Autocomplete suggestions
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from routers import chat, recommendations, search
from services.recommendation_engine import RecommendationEngine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    print("[AI] ShopEasy AI Service starting...")
    # Pre-warm the recommendation model
    app.state.rec_engine = RecommendationEngine()
    await app.state.rec_engine.load_model()
    print("[AI] Recommendation engine loaded")
    yield
    print("[AI] ShopEasy AI Service shutting down")


app = FastAPI(
    title="ShopEasy AI Service",
    description="AI-powered features: chatbot, recommendations, smart search",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat.router,            prefix="/ai", tags=["Chatbot"])
app.include_router(recommendations.router, prefix="/ai", tags=["Recommendations"])
app.include_router(search.router,          prefix="/ai", tags=["Smart Search"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "shopeasy-ai"}


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "ShopEasy AI Service",
        "version": "1.0.0",
        "endpoints": {
            "recommendations": "GET  /ai/recommendations",
            "search":          "GET  /ai/search",
            "suggestions":     "GET  /ai/suggestions",
            "docs":            "GET  /docs",
        },
    }
