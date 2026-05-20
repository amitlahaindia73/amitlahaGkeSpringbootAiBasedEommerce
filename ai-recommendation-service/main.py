"""AI recommendation service entrypoint for Amitra Commerce Mesh."""
"""
FastAPI AI Recommendation Service (Gemini version)

This service:
- consumes Kafka product and order events
- stores lightweight user affinity scores in MongoDB
- caches final recommendations in Redis
- exposes the original recommendation endpoint unchanged
- uses Google Gemini API for explanation and assistant endpoints

Design goals:
- preserve the existing recommendation logic and endpoints
- add a real recommendation engine before the Gemini explanation layer
- keep working even when Gemini is unavailable
- return structured JSON for UI friendliness
"""

import json
import os
import threading
import time
from collections import Counter as PyCounter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests
import uvicorn
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from kafka import KafkaConsumer
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
from pydantic import BaseModel, Field
from pymongo import MongoClient
import redis

app = FastAPI(title="AI Recommendation Service")

REQUEST_COUNTER = Counter("ai_recommendation_requests_total", "Total recommendation requests")
LLM_REQUEST_COUNTER = Counter("ai_llm_requests_total", "Total LLM-backed AI requests")
LLM_FALLBACK_COUNTER = Counter("ai_llm_fallback_total", "Total fallback responses when LLM is unavailable")

MONGO_URI = os.getenv("AI_MONGO_URI", "mongodb://mongodb:27017")
REDIS_HOST = os.getenv("AI_REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("AI_REDIS_PORT", "6379"))
KAFKA_BOOTSTRAP_SERVERS = os.getenv("AI_KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")
AI_CACHE_TTL_SECONDS = int(os.getenv("AI_CACHE_TTL_SECONDS", "60"))

GEMINI_ENABLED = os.getenv("GEMINI_ENABLED", "true").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
GEMINI_TIMEOUT_SECONDS = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "30"))

PRODUCT_SERVICE_BASE_URL = os.getenv("PRODUCT_SERVICE_BASE_URL", "http://product-service:8083")
PRODUCT_SERVICE_TIMEOUT_SECONDS = int(os.getenv("PRODUCT_SERVICE_TIMEOUT_SECONDS", "5"))
AI_PRODUCT_DB_NAME = os.getenv("AI_PRODUCT_DB_NAME", "product_db")
AI_MIN_RECOMMENDATIONS = int(os.getenv("AI_MIN_RECOMMENDATIONS", "5"))
AI_MAX_RECOMMENDATIONS = int(os.getenv("AI_MAX_RECOMMENDATIONS", "10"))

mongo_client = MongoClient(MONGO_URI)
ai_db = mongo_client["ai_recommendation_db"]
product_db = mongo_client[AI_PRODUCT_DB_NAME]
user_scores_collection = ai_db["user_product_scores"]
products_collection = product_db["products"]
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


class ProductAssistantRequest(BaseModel):
    userId: str
    question: str
    currentProduct: Optional[Dict[str, Any]] = None
    recentViewedProducts: List[Dict[str, Any]] = Field(default_factory=list)
    recentOrders: List[Dict[str, Any]] = Field(default_factory=list)


class CompareProductsRequest(BaseModel):
    userId: str
    products: List[Dict[str, Any]] = Field(default_factory=list)
    comparisonGoal: str = "Help compare these products"


class HomeSummaryRequest(BaseModel):
    userId: str
    recentViewedProducts: List[Dict[str, Any]] = Field(default_factory=list)
    recentOrders: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_product_id(product_id: Any) -> Optional[str]:
    if not isinstance(product_id, str):
        return None

    normalized = product_id.strip()
    if not normalized:
        return None

    if normalized.upper() == "ORDER":
        return None

    return normalized


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def tokenize_text(*values: Any) -> set[str]:
    tokens: set[str] = set()
    for value in values:
        if not value:
            continue
        text = str(value).lower()
        current = []
        for ch in text:
            if ch.isalnum():
                current.append(ch)
            else:
                if len(current) >= 3:
                    tokens.add("".join(current))
                current = []
        if len(current) >= 3:
            tokens.add("".join(current))
    return tokens


def parse_iso_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    if not isinstance(value, str) or not value.strip():
        return None
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


def recency_points(event_time: Optional[datetime]) -> int:
    if not event_time:
        return 0
    age_seconds = (utc_now() - event_time).total_seconds()
    if age_seconds < 0:
        return 5
    if age_seconds <= 24 * 3600:
        return 15
    if age_seconds <= 7 * 24 * 3600:
        return 10
    if age_seconds <= 30 * 24 * 3600:
        return 5
    return 0


def is_valid_explanation_payload(payload: Dict[str, Any]) -> bool:
    if not isinstance(payload, dict):
        return False

    recommendations = payload.get("recommendations")
    if not isinstance(recommendations, list):
        return False

    required_fields = {
        "productId",
        "score",
        "whyRecommended",
        "customerIntent",
        "recommendedUseCase",
        "crossSellHint",
    }

    for item in recommendations:
        if not isinstance(item, dict):
            return False
        if not required_fields.issubset(item.keys()):
            return False

    return True


def transform_base_payload_to_explanations(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    recommendations = payload.get("recommendations", [])
    items: List[Dict[str, Any]] = []

    for rec in recommendations:
        score = rec.get("score", 0)
        intent = "high-interest" if score >= 70 else "evaluating options" if score >= 40 else "browsing"
        use_case = rec.get("useCaseHint") or ("repeat purchase or strong preference" if score >= 70 else "early exploration")
        cross_sell = rec.get("crossSellHint") or (
            "Consider warranty, accessories, or similar items."
            if score >= 70
            else "Compare with related alternatives before checkout."
        )

        reason = rec.get("reason", "")
        if reason:
            why_recommended = reason
        else:
            why_recommended = "This product aligns with your recent shopping activity and preference pattern."

        items.append(
            {
                "productId": rec.get("productId"),
                "score": score,
                "whyRecommended": why_recommended,
                "customerIntent": intent,
                "recommendedUseCase": use_case,
                "crossSellHint": cross_sell,
            }
        )

    return {
        "userId": user_id,
        "recommendations": items,
        "source": "gemini-transformed",
    }


def update_user_score(user_id: str, product_id: str, increment: int, event_type: str) -> None:
    now = utc_now()
    updates: Dict[str, Any] = {
        "$inc": {
            "score": increment,
            "viewCount": 1 if event_type == "view" else 0,
            "purchaseCount": 1 if event_type == "purchase" else 0,
        },
        "$set": {
            "lastEventType": event_type,
            "lastEventAt": now,
        },
        "$setOnInsert": {
            "userId": user_id,
            "productId": product_id,
            "firstEventAt": now,
        },
    }
    user_scores_collection.update_one(
        {"userId": user_id, "productId": product_id},
        updates,
        upsert=True,
    )
    redis_client.delete(f"recommendations:{user_id}")
    redis_client.delete(f"recommendation-explanations:{user_id}")
    redis_client.delete(f"home-summary:{user_id}")


def kafka_consumer_worker() -> None:
    while True:
        try:
            consumer = KafkaConsumer(
                "product.viewed",
                "order.completed",
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                auto_offset_reset="earliest",
                group_id="ai-recommendation-service-group",
                value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            )

            for message in consumer:
                payload = message.value
                topic = message.topic

                user_id = payload.get("userId")
                product_id = normalize_product_id(payload.get("productId"))
                if not user_id or not product_id:
                    continue

                if topic == "product.viewed":
                    update_user_score(user_id, product_id, 1, "view")
                elif topic == "order.completed":
                    update_user_score(user_id, product_id, 5, "purchase")
        except Exception as exc:
            print(f"Kafka consumer retry due to error: {type(exc).__name__}: {exc}", flush=True)
            time.sleep(5)


@app.on_event("startup")
def start_background_consumer() -> None:
    thread = threading.Thread(target=kafka_consumer_worker, daemon=True)
    thread.start()


def load_all_active_products() -> List[Dict[str, Any]]:
    products = list(
        products_collection.find(
            {
                "$and": [
                    {"$or": [{"active": True}, {"active": {"$exists": False}}, {"active": None}]},
                    {"$or": [{"availableQuantity": {"$gt": 0}}, {"availableQuantity": {"$exists": False}}, {"availableQuantity": None}]},
                ]
            },
            {"_id": 0},
        )
    )
    return [p for p in products if p.get("id")]


def get_user_interaction_rows(user_id: str) -> List[Dict[str, Any]]:
    return list(user_scores_collection.find({"userId": user_id}, {"_id": 0}).sort("score", -1))


def get_global_popularity_map() -> Dict[str, int]:
    popularity: Dict[str, int] = defaultdict(int)
    for row in user_scores_collection.find({}, {"_id": 0, "productId": 1, "score": 1, "viewCount": 1, "purchaseCount": 1}):
        product_id = row.get("productId")
        if not product_id:
            continue
        popularity[product_id] += int(row.get("score", 0)) + int(row.get("viewCount", 0)) + (int(row.get("purchaseCount", 0)) * 3)
    return popularity


def build_user_preference_profile(user_rows: List[Dict[str, Any]], products_by_id: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    purchased_ids = set()
    viewed_ids = set()
    interacted_ids = set()
    category_scores: Dict[str, int] = defaultdict(int)
    keyword_scores: Dict[str, int] = defaultdict(int)
    interacted_prices: List[float] = []
    strongest_event_time: Optional[datetime] = None

    for row in user_rows:
        product_id = row.get("productId")
        if not product_id:
            continue
        interacted_ids.add(product_id)
        view_count = int(row.get("viewCount", 0) or 0)
        purchase_count = int(row.get("purchaseCount", 0) or 0)
        total_score = int(row.get("score", 0) or 0)
        if view_count > 0:
            viewed_ids.add(product_id)
        if purchase_count > 0:
            purchased_ids.add(product_id)

        product = products_by_id.get(product_id)
        if product:
            category = (product.get("category") or "").strip().lower()
            if category:
                category_scores[category] += (purchase_count * 25) + (view_count * 10) + total_score
            price = safe_float(product.get("price"), -1)
            if price >= 0:
                interacted_prices.append(price)
            for token in tokenize_text(product.get("name"), product.get("description"), product.get("category")):
                keyword_scores[token] += (purchase_count * 6) + (view_count * 2) + min(total_score, 10)

        last_event_at = parse_iso_datetime(row.get("lastEventAt"))
        if last_event_at and (strongest_event_time is None or last_event_at > strongest_event_time):
            strongest_event_time = last_event_at

    avg_price = sum(interacted_prices) / len(interacted_prices) if interacted_prices else None

    return {
        "purchased_ids": purchased_ids,
        "viewed_ids": viewed_ids,
        "interacted_ids": interacted_ids,
        "category_scores": dict(category_scores),
        "keyword_scores": dict(keyword_scores),
        "avg_price": avg_price,
        "last_event_at": strongest_event_time,
    }


def build_reason_parts(product: Dict[str, Any], profile: Dict[str, Any], popularity_value: int, score_breakdown: Dict[str, int]) -> List[str]:
    parts: List[str] = []
    category = (product.get("category") or "").strip()
    if category and score_breakdown.get("category", 0) > 0:
        parts.append(f"Strong match with your interest in {category}")
    if score_breakdown.get("price", 0) > 0:
        parts.append("Fits your recent price preference")
    if score_breakdown.get("keyword", 0) > 0:
        parts.append("Shares features similar to products you explored")
    if popularity_value > 0 and score_breakdown.get("popularity", 0) > 0:
        parts.append("Popular with shoppers showing similar behavior")
    if score_breakdown.get("novelty", 0) > 0:
        parts.append("New option in a category you already like")
    if not parts:
        parts.append("Relevant to your recent catalog activity")
    return parts


def rank_candidate_products(user_id: str) -> Dict[str, Any]:
    user_rows = get_user_interaction_rows(user_id)
    if not user_rows:
        return {"userId": user_id, "recommendations": [], "source": "recommendation-engine", "strategy": "behavioral-ranking-v2"}

    products = load_all_active_products()
    if not products:
        fallback_recs = [
            {
                "productId": row.get("productId"),
                "score": int(row.get("score", 0) or 0),
                "reason": "Derived from local behavior events",
            }
            for row in user_rows
            if row.get("productId")
        ]
        return {"userId": user_id, "recommendations": fallback_recs[:AI_MAX_RECOMMENDATIONS], "source": "recommendation-engine", "strategy": "event-score-fallback"}

    products_by_id = {p.get("id"): p for p in products if p.get("id")}
    profile = build_user_preference_profile(user_rows, products_by_id)
    popularity_map = get_global_popularity_map()
    top_popularity = max(popularity_map.values()) if popularity_map else 0
    interacted_ids = profile["interacted_ids"]
    purchased_ids = profile["purchased_ids"]
    category_scores = profile["category_scores"]
    keyword_scores = profile["keyword_scores"]
    avg_price = profile["avg_price"]

    ranked: List[Dict[str, Any]] = []
    backfill_seen: List[Dict[str, Any]] = []

    for product in products:
        product_id = product.get("id")
        if not product_id:
            continue

        category = (product.get("category") or "").strip().lower()
        product_price = safe_float(product.get("price"), 0.0)
        product_tokens = tokenize_text(product.get("name"), product.get("description"), product.get("category"))
        keyword_match = sum(keyword_scores.get(token, 0) for token in product_tokens)
        category_match = min(int(category_scores.get(category, 0) * 0.9), 60) if category else 0

        price_match = 0
        if avg_price is not None and avg_price > 0 and product_price > 0:
            difference_ratio = abs(product_price - avg_price) / max(avg_price, 1)
            if difference_ratio <= 0.15:
                price_match = 18
            elif difference_ratio <= 0.35:
                price_match = 10
            elif difference_ratio <= 0.6:
                price_match = 4

        popularity_value = popularity_map.get(product_id, 0)
        popularity_score = 0
        if top_popularity > 0 and popularity_value > 0:
            popularity_score = min(int((popularity_value / top_popularity) * 15), 15)

        recency_score = recency_points(profile.get("last_event_at"))
        novelty_bonus = 8 if product_id not in interacted_ids else 0
        repeat_penalty = -35 if product_id in purchased_ids else 0
        already_viewed_penalty = -8 if product_id in profile["viewed_ids"] else 0

        score_breakdown = {
            "category": category_match,
            "keyword": min(keyword_match, 25),
            "price": price_match,
            "popularity": popularity_score,
            "recency": recency_score,
            "novelty": novelty_bonus,
            "repeatPenalty": repeat_penalty,
            "viewPenalty": already_viewed_penalty,
        }
        final_score = sum(score_breakdown.values())
        if final_score <= 0:
            continue

        item = {
            "productId": product_id,
            "score": final_score,
            "reason": ". ".join(build_reason_parts(product, profile, popularity_value, score_breakdown)) + ".",
            "category": product.get("category"),
            "name": product.get("name"),
            "price": product.get("price"),
        }

        if product_id in interacted_ids:
            backfill_seen.append(item)
        else:
            ranked.append(item)

    ranked.sort(key=lambda x: (-int(x.get("score", 0)), str(x.get("productId"))))
    backfill_seen.sort(key=lambda x: (-int(x.get("score", 0)), str(x.get("productId"))))

    selected = ranked[:AI_MAX_RECOMMENDATIONS]
    if len(selected) < AI_MIN_RECOMMENDATIONS:
        needed = AI_MIN_RECOMMENDATIONS - len(selected)
        selected.extend(backfill_seen[:needed])

    if not selected:
        selected = [
            {
                "productId": row.get("productId"),
                "score": int(row.get("score", 0) or 0),
                "reason": "Derived from local behavior events.",
            }
            for row in user_rows
            if row.get("productId")
        ][:AI_MAX_RECOMMENDATIONS]

    return {
        "userId": user_id,
        "recommendations": selected,
        "source": "recommendation-engine",
        "strategy": "behavioral-ranking-v2",
    }


def get_base_recommendations(user_id: str) -> Dict[str, Any]:
    cache_key = f"recommendations:{user_id}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    response = rank_candidate_products(user_id)
    redis_client.setex(cache_key, AI_CACHE_TTL_SECONDS, json.dumps(response))
    return response


def unwrap_product_response(data: Any) -> Dict[str, Any]:
    if isinstance(data, dict) and isinstance(data.get("data"), dict):
        return data["data"]
    if isinstance(data, dict):
        return data
    return {}


def fetch_product_details(product_id: str) -> Dict[str, Any]:
    """
    Enrich recommendation prompts with real product data from product-service.
    If the lookup fails, return a minimal fallback object so the endpoint never breaks.
    """
    mongo_product = products_collection.find_one({"id": product_id}, {"_id": 0}) or {}
    fallback = {
        "productId": product_id,
        "name": mongo_product.get("name") or product_id,
        "category": mongo_product.get("category") or "Unknown",
        "brand": mongo_product.get("brand") or "Unknown",
        "price": mongo_product.get("price"),
        "shortDescription": mongo_product.get("description") or mongo_product.get("shortDescription") or "",
    }

    candidate_urls = [
        f"{PRODUCT_SERVICE_BASE_URL}/api/products/{product_id}",
        f"{PRODUCT_SERVICE_BASE_URL}/products/{product_id}",
    ]

    for url in candidate_urls:
        try:
            response = requests.get(url, timeout=PRODUCT_SERVICE_TIMEOUT_SECONDS)
            if not response.ok:
                continue

            payload = unwrap_product_response(response.json())
            if not isinstance(payload, dict) or not payload:
                continue

            return {
                "productId": payload.get("id") or payload.get("productId") or product_id,
                "name": payload.get("name") or payload.get("productName") or fallback["name"],
                "category": payload.get("category") or payload.get("productCategory") or fallback["category"],
                "brand": payload.get("brand") or fallback["brand"],
                "price": payload.get("price") if payload.get("price") is not None else fallback["price"],
                "shortDescription": payload.get("description") or payload.get("shortDescription") or fallback["shortDescription"],
            }
        except Exception as exc:
            print(f"PRODUCT DETAIL LOOKUP FAILED for {product_id}: {type(exc).__name__}: {exc}", flush=True)

    return fallback


def gemini_available() -> bool:
    return GEMINI_ENABLED and bool(GEMINI_API_KEY.strip())


def call_gemini_json(system_prompt: str, user_prompt: str, fallback_payload: Dict[str, Any]) -> Dict[str, Any]:
    if not gemini_available():
        print("GEMINI UNAVAILABLE: returning fallback payload", flush=True)
        LLM_FALLBACK_COUNTER.inc()
        return fallback_payload

    LLM_REQUEST_COUNTER.inc()
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {
                    "parts": [{"text": user_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        response = requests.post(
            url,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=GEMINI_TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        body = response.json()
        candidates = body.get("candidates", [])
        if not candidates:
            print("GEMINI: no candidates returned", flush=True)
            LLM_FALLBACK_COUNTER.inc()
            return fallback_payload

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            print("GEMINI: no parts returned", flush=True)
            LLM_FALLBACK_COUNTER.inc()
            return fallback_payload

        content = parts[0].get("text", "{}")
        print("GEMINI RAW CONTENT:", content, flush=True)

        parsed = json.loads(content)
        print("GEMINI PARSED JSON:", json.dumps(parsed, ensure_ascii=False), flush=True)

        return parsed if isinstance(parsed, dict) else fallback_payload
    except Exception as exc:
        print(f"GEMINI fallback due to error: {type(exc).__name__}: {exc}", flush=True)
        LLM_FALLBACK_COUNTER.inc()
        return fallback_payload


def build_fallback_explanations(user_id: str, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
    items = []
    for rec in recommendations:
        score = rec.get("score", 0)
        intent = "high-interest" if score >= 70 else "evaluating options" if score >= 40 else "browsing"
        use_case = "good fit for your recent category and price interest" if score >= 40 else "worth comparing with related products"
        cross_sell = "Consider warranty, accessories, or similar items." if score >= 40 else "Compare with related alternatives before checkout."
        items.append(
            {
                "productId": rec.get("productId"),
                "score": score,
                "whyRecommended": rec.get("reason") or f"Recommended from your recent local behavior score of {score}.",
                "customerIntent": intent,
                "recommendedUseCase": use_case,
                "crossSellHint": cross_sell,
            }
        )
    return {"userId": user_id, "recommendations": items, "source": "fallback"}


@app.get("/api/recommendations/{user_id}")
def get_recommendations(user_id: str):
    REQUEST_COUNTER.inc()
    return get_base_recommendations(user_id)


@app.get("/api/recommendations/{user_id}/explanations")
def get_recommendation_explanations(user_id: str):
    print("CURRENT GEMINI MODEL:", GEMINI_MODEL, flush=True)
    REQUEST_COUNTER.inc()

    cache_key = f"recommendation-explanations:{user_id}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    base = get_base_recommendations(user_id)
    fallback = build_fallback_explanations(user_id, base.get("recommendations", []))

    if not base.get("recommendations"):
        redis_client.setex(cache_key, AI_CACHE_TTL_SECONDS, json.dumps(fallback))
        return fallback

    enriched_items: List[Dict[str, Any]] = []
    for rec in base.get("recommendations", []):
        product_id = rec.get("productId")
        product_details = fetch_product_details(product_id)
        enriched_items.append(
            {
                "productId": product_id,
                "score": rec.get("score", 0),
                "reason": rec.get("reason"),
                "name": product_details.get("name"),
                "category": product_details.get("category"),
                "brand": product_details.get("brand"),
                "price": product_details.get("price"),
                "shortDescription": product_details.get("shortDescription"),
            }
        )

    system_prompt = """You are a smart e-commerce recommendation explanation engine.
The recommendation ranking is already decided by the platform.
Your job is only to generate realistic explanation fields for each selected product.

Rules:
- Keep productId and score unchanged
- Respect the existing reason and product metadata
- Do not invent brands or specifications not present in the input
- Explain why the user may like the product
- Infer likely customer intent from the score and product context
- Suggest a realistic use case based on category, name, brand, or description
- Suggest a meaningful cross-sell hint related to the product type
- Return JSON only

Return exactly this JSON shape:
{"userId": string, "source": string, "recommendations": [{"productId": string, "score": number, "whyRecommended": string, "customerIntent": string, "recommendedUseCase": string, "crossSellHint": string}]}
"""

    user_prompt = json.dumps(
        {
            "userId": base.get("userId"),
            "strategy": base.get("strategy"),
            "items": enriched_items,
        }
    )

    enriched = call_gemini_json(system_prompt, user_prompt, fallback)

    print("GEMINI ENRICHED BEFORE VALIDATION:", json.dumps(enriched, ensure_ascii=False), flush=True)
    is_valid = is_valid_explanation_payload(enriched)
    print("EXPLANATION PAYLOAD VALID:", is_valid, flush=True)

    if enriched.get("source") == "fallback":
        print("FINAL EXPLANATION SOURCE: fallback (returned directly from fallback path)", flush=True)
        enriched = fallback
    elif is_valid:
        enriched.setdefault("userId", user_id)
        enriched["source"] = "gemini"
        print("FINAL EXPLANATION SOURCE: gemini", flush=True)
    elif isinstance(enriched, dict) and isinstance(enriched.get("recommendations"), list):
        print("FINAL EXPLANATION SOURCE: gemini-transformed (base payload mapped to rich schema)", flush=True)
        enriched = transform_base_payload_to_explanations(user_id, enriched)
    else:
        print("FINAL EXPLANATION SOURCE: fallback (Gemini payload unusable)", flush=True)
        enriched = fallback

    redis_client.setex(cache_key, AI_CACHE_TTL_SECONDS, json.dumps(enriched))
    return enriched


@app.post("/api/ai/product-assistant")
def product_assistant(request: ProductAssistantRequest):
    REQUEST_COUNTER.inc()
    fallback = {
        "userId": request.userId,
        "answer": (
            "This assistant is using fallback mode. Based on the provided product and activity, "
            "focus on price, fit-for-purpose, warranty, and comparable alternatives before checkout."
        ),
        "suggestedActions": [
            "Compare with similar products",
            "Check warranty and return policy",
            "Review recent order and browsing pattern",
        ],
        "source": "fallback",
    }

    system_prompt = (
        "You are a concise e-commerce product assistant. "
        "Return only valid JSON with shape {userId:string, answer:string, suggestedActions:[string], source:string}."
    )
    user_prompt = request.model_dump_json()
    response = call_gemini_json(system_prompt, user_prompt, fallback)
    response.setdefault("userId", request.userId)
    if response.get("source") != "fallback":
        response["source"] = "gemini"
    return response


@app.post("/api/ai/compare-products")
def compare_products(request: CompareProductsRequest):
    REQUEST_COUNTER.inc()
    fallback = {
        "userId": request.userId,
        "summary": "Fallback comparison: choose based on price, features, durability, and fit for your exact use case.",
        "recommendation": "Pick the product with the clearest value for your primary need.",
        "source": "fallback",
    }

    system_prompt = (
        "You are a concise e-commerce comparison assistant. "
        "Return only valid JSON with shape {userId:string, summary:string, recommendation:string, source:string}."
    )
    user_prompt = request.model_dump_json()
    response = call_gemini_json(system_prompt, user_prompt, fallback)
    response.setdefault("userId", request.userId)
    if response.get("source") != "fallback":
        response["source"] = "gemini"
    return response


@app.post("/api/ai/home-summary")
def home_summary(request: HomeSummaryRequest):
    REQUEST_COUNTER.inc()
    cache_key = f"home-summary:{request.userId}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    fallback = {
        "userId": request.userId,
        "headline": "Top picks based on your recent activity",
        "summary": "Your recommendations are shaped by local browsing and purchase behavior captured in the platform.",
        "source": "fallback",
    }

    system_prompt = (
        "You are a concise e-commerce home personalization assistant. "
        "Return only valid JSON with shape {userId:string, headline:string, summary:string, source:string}."
    )
    user_prompt = request.model_dump_json()
    response = call_gemini_json(system_prompt, user_prompt, fallback)
    response.setdefault("userId", request.userId)
    if response.get("source") != "fallback":
        response["source"] = "gemini"
    redis_client.setex(cache_key, AI_CACHE_TTL_SECONDS, json.dumps(response))
    return response


@app.get("/health")
def health():
    return {
        "status": "UP",
        "geminiEnabled": GEMINI_ENABLED,
        "geminiModel": GEMINI_MODEL,
        "geminiConfigured": bool(GEMINI_API_KEY.strip()),
        "productServiceBaseUrl": PRODUCT_SERVICE_BASE_URL,
        "productDbName": AI_PRODUCT_DB_NAME,
    }


@app.get("/metrics")
def metrics():
    return PlainTextResponse(generate_latest().decode("utf-8"), media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
