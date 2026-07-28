"""
Shared Pydantic schemas for the ShopEasy AI Service.
"""

from pydantic import BaseModel
from typing import List, Optional


class HealthResponse(BaseModel):
    status: str
    service: str


class ChatMessage(BaseModel):
    role: str       # "user" | "bot" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply:       str
    intent:      Optional[str]       = None
    suggestions: Optional[List[str]] = None


class ProductSchema(BaseModel):
    id:         int
    name:       str
    category:   str
    price:      float
    rating:     float
    popularity: float


class RecommendationRequest(BaseModel):
    user_id:    Optional[int] = None
    product_id: Optional[int] = None
    limit:      int = 8


class SearchRequest(BaseModel):
    query: str
    limit: int = 10


class SearchResult(BaseModel):
    id:       int
    name:     str
    category: str
    price:    float
    score:    float


class SuggestionItem(BaseModel):
    id:       int
    label:    str
    category: str
