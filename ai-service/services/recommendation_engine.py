"""
Recommendation Engine
---------------------
Implements collaborative filtering + content-based hybrid recommendations.
Uses in-memory numpy matrices; swap for a real DB in production.
"""

import numpy as np
from typing import List, Dict, Optional
import asyncio
import random


class RecommendationEngine:
    """
    Hybrid recommendation engine:
      1. Collaborative filtering  — user-item interaction matrix
      2. Content-based            — product category & price similarity
      3. Popularity fallback      — trending items for cold start
    """

    def __init__(self):
        self.is_loaded     = False
        self.product_data  = []
        self.user_matrix   = None   # (n_users × n_products) sparse matrix
        self.item_sim      = None   # (n_products × n_products) cosine similarity

    async def load_model(self):
        """Load / build the recommendation model."""
        await asyncio.sleep(0)    # yield to event loop

        # Seed product catalog (replace with real DB query in production)
        self.product_data = [
            {"id": i, "name": name, "category": cat, "price": price, "rating": rating, "popularity": pop}
            for i, (name, cat, price, rating, pop) in enumerate([
                ("Pro Wireless Headphones", "Electronics",  149.99, 4.8, 0.95),
                ("Ergonomic Office Chair",  "Furniture",    389.00, 4.6, 0.80),
                ("Steel Water Bottle",      "Lifestyle",     34.99, 4.9, 0.92),
                ("Gaming Keyboard",         "Electronics",  129.99, 4.7, 0.88),
                ("Yoga Mat Premium",        "Sports",        59.99, 4.8, 0.75),
                ("Smart Coffee Maker",      "Kitchen",      219.00, 4.5, 0.70),
                ("Running Shoes",           "Sports",        99.99, 4.6, 0.85),
                ("LED Desk Lamp",           "Electronics",   79.99, 4.7, 0.78),
                ("Resistance Bands Set",    "Sports",        29.99, 4.5, 0.65),
                ("Instant Pot",             "Kitchen",      149.99, 4.8, 0.90),
                ("Laptop Stand",            "Electronics",   49.99, 4.6, 0.72),
                ("Foam Roller",             "Sports",        24.99, 4.4, 0.60),
            ], 1)
        ]

        # Build item-item similarity matrix (content-based)
        n = len(self.product_data)
        categories = list({p["category"] for p in self.product_data})
        cat_idx    = {c: i for i, c in enumerate(categories)}

        features = np.zeros((n, len(categories) + 2))
        for i, p in enumerate(self.product_data):
            features[i, cat_idx[p["category"]]] = 1.0       # one-hot category
            features[i, -2] = p["price"] / 400.0            # normalized price
            features[i, -1] = p["rating"] / 5.0             # normalized rating

        # Cosine similarity
        norms = np.linalg.norm(features, axis=1, keepdims=True)
        norms[norms == 0] = 1
        normed       = features / norms
        self.item_sim = normed @ normed.T

        self.is_loaded = True

    def get_similar_products(self, product_id: int, top_k: int = 6) -> List[Dict]:
        """Content-based: products similar to a given product."""
        if not self.is_loaded or not self.product_data:
            return self._popular_products(top_k)

        ids = [p["id"] for p in self.product_data]
        if product_id not in ids:
            return self._popular_products(top_k)

        idx     = ids.index(product_id)
        sims    = self.item_sim[idx]
        top_idx = np.argsort(sims)[::-1][1 : top_k + 1]   # skip self
        return [self.product_data[i] for i in top_idx]

    def get_user_recommendations(self, user_id: int, top_k: int = 8) -> List[Dict]:
        """
        Collaborative filtering stub — returns personalised recommendations.
        In production, replace with a real CF model trained on interaction logs.
        """
        if not self.is_loaded:
            return self._popular_products(top_k)

        # Seed with user_id for deterministic personalisation demo
        rng      = np.random.default_rng(user_id or 42)
        shuffled = rng.permutation(len(self.product_data))
        top_idx  = shuffled[:top_k]
        return [self.product_data[i] for i in top_idx]

    def _popular_products(self, top_k: int) -> List[Dict]:
        """Popularity fallback for cold-start."""
        sorted_prods = sorted(self.product_data, key=lambda p: p["popularity"], reverse=True)
        return sorted_prods[:top_k]
