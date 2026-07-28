"""
Recommendations Router
----------------------
Serves personalized and similar-product recommendations.
"""

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class ProductRecommendation(BaseModel):
    id:         int
    name:       str
    category:   str
    price:      float
    rating:     float
    popularity: float


class RecommendationsResponse(BaseModel):
    user_id:         Optional[int]
    product_id:      Optional[int]
    recommendations: List[ProductRecommendation]
    strategy:        str


@router.get("/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(
    request:    Request,
    user_id:    Optional[int] = Query(None, description="User ID for personalised recs"),
    product_id: Optional[int] = Query(None, description="Product ID for similar items"),
    limit:      int           = Query(8, ge=1, le=20),
):
    engine = request.app.state.rec_engine

    if product_id:
        products = engine.get_similar_products(product_id, top_k=limit)
        strategy = "content_based"
    elif user_id:
        products = engine.get_user_recommendations(user_id, top_k=limit)
        strategy = "collaborative_filtering"
    else:
        products = engine._popular_products(limit)
        strategy = "popularity"

    recs = [
        ProductRecommendation(
            id=p["id"], name=p["name"], category=p["category"],
            price=p["price"], rating=p["rating"], popularity=p["popularity"],
        )
        for p in products
    ]
    return RecommendationsResponse(
        user_id=user_id, product_id=product_id,
        recommendations=recs, strategy=strategy,
    )
