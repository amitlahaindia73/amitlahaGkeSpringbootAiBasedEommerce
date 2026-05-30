import os
import re
import json
import hashlib
import tempfile
from datetime import datetime, timezone

import requests
import chromadb
import functions_framework
from pymongo import MongoClient
from pypdf import PdfReader
from google.cloud import storage
from cloudevents.http import CloudEvent


BUCKET_NAME = os.getenv("GCS_BUCKET", "amitra-policypdf-amitra-commerce-dev")
POLICY_PREFIX = os.getenv("POLICY_PREFIX", "policies/versions/")
POLICY_FILE_PATTERN = os.getenv("POLICY_FILE_PATTERN", r"business-policy-v(\d+)\.pdf")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://10.160.0.2:27017")
MONGO_DB = os.getenv("MONGO_DB", "product_db")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "products")

CHROMA_HOST = os.getenv("CHROMA_HOST", "10.160.0.2")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8002"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "amitra_product_policy_kb")

EMBEDDING_URL = os.getenv("EMBEDDING_URL", "http://10.160.0.2:8089/embed")

POLICY_TYPES = ["Delivery", "Cancellation", "Return", "Refund"]
CATEGORIES = ["Electronics", "Fashion", "Toys", "Sports", "Office"]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def extract_version(object_name: str):
    file_name = object_name.split("/")[-1]
    match = re.match(POLICY_FILE_PATTERN, file_name)

    if not match:
        return None

    return int(match.group(1))


def get_latest_policy_object(bucket_name: str):
    client = storage.Client()
    bucket = client.bucket(bucket_name)

    latest_version = -1
    latest_blob_name = None

    for blob in bucket.list_blobs(prefix=POLICY_PREFIX):
        version = extract_version(blob.name)

        if version is not None and version > latest_version:
            latest_version = version
            latest_blob_name = blob.name

    if latest_blob_name is None:
        raise RuntimeError("No valid policy version file found in bucket")

    return latest_blob_name, latest_version


def get_embedding(text: str):
    response = requests.post(
        EMBEDDING_URL,
        json={"inputs": text},
        timeout=120
    )
    response.raise_for_status()
    data = response.json()

    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
        return data[0]

    if isinstance(data, list):
        return data

    raise RuntimeError(f"Unexpected embedding response: {data}")


def read_pdf_from_gcs(bucket_name: str, object_name: str) -> str:
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)

    if not blob.exists():
        raise FileNotFoundError(f"PDF not found: gs://{bucket_name}/{object_name}")

    with tempfile.NamedTemporaryFile(suffix=".pdf") as temp:
        blob.download_to_filename(temp.name)

        reader = PdfReader(temp.name)
        text = ""

        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        return text


def extract_policy_map(pdf_text: str):
    policy_map = {}

    for index, category in enumerate(CATEGORIES):
        start = pdf_text.find(category)

        if start == -1:
            continue

        next_positions = []

        for next_category in CATEGORIES[index + 1:]:
            next_pos = pdf_text.find(next_category, start + len(category))
            if next_pos != -1:
                next_positions.append(next_pos)

        end = min(next_positions) if next_positions else len(pdf_text)
        section = pdf_text[start:end]

        policy_map[category] = {}

        for policy_type in POLICY_TYPES:
            pattern = rf"{policy_type}\s*:\s*(.*?)(?=\n|$)"
            match = re.search(pattern, section, re.IGNORECASE)

            if match:
                policy_map[category][policy_type.lower()] = match.group(1).strip()

    return policy_map


def get_price_band(price):
    price = float(price)

    if price <= 100:
        return "LOW_VALUE"
    elif price <= 150:
        return "MID_VALUE"
    else:
        return "HIGH_VALUE"


def fetch_active_products():
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    collection = db[MONGO_COLLECTION]

    return list(collection.find({"active": True}))


def build_product_policy_chunks(products, policy_map, policy_file, policy_version):
    chunks = []

    for product in products:
        product_id = str(product.get("_id"))
        sku = product.get("sku", "")
        name = product.get("name", "")
        category = product.get("category", "")
        description = product.get("description", "")
        price = product.get("price", 0)
        available_quantity = product.get("availableQuantity", 0)

        category_policy = policy_map.get(category)

        if not category_policy:
            print(f"No policy found for category={category}, product={product_id}")
            continue

        price_band = get_price_band(price)

        for policy_type, policy_text in category_policy.items():
            doc_id = f"product_policy::{product_id}::{category.lower()}::{policy_type}"

            document = f"""
Amitra Commerce Mesh Product Policy Knowledge

Policy Version: v{policy_version}
Policy File: {policy_file}

Product ID: {product_id}
SKU: {sku}
Product Name: {name}
Category: {category}
Description: {description}
Price: {price}
Price Band: {price_band}
Available Quantity: {available_quantity}

Policy Type: {policy_type.upper()}

Applicable Policy:
{policy_text}

Business Mapping:
This {policy_type} policy applies because product '{name}' belongs to category '{category}'.
The product price is {price}, so it is classified as {price_band}.
"""

            metadata = {
                "source": "gcs_versioned_policy_pdf_plus_mongo_product",
                "policy_file": policy_file,
                "policy_version": f"v{policy_version}",
                "product_id": product_id,
                "sku": sku,
                "product_name": name,
                "category": category,
                "price": str(price),
                "price_band": price_band,
                "policy_type": policy_type,
                "content_hash": hash_text(document),
                "updated_at": now_iso()
            }

            chunks.append({
                "id": doc_id,
                "document": document,
                "metadata": metadata
            })

    return chunks


def get_chroma_collection():
    client = chromadb.HttpClient(
        host=CHROMA_HOST,
        port=CHROMA_PORT
    )

    return client.get_or_create_collection(
        name=CHROMA_COLLECTION
    )


def sync_to_chroma(new_chunks):
    collection = get_chroma_collection()

    existing = collection.get()
    existing_ids = set(existing.get("ids", []))
    new_ids = set(chunk["id"] for chunk in new_chunks)

    existing_metadata_by_id = {}

    for index, existing_id in enumerate(existing.get("ids", [])):
        metadatas = existing.get("metadatas", [])
        if index < len(metadatas):
            existing_metadata_by_id[existing_id] = metadatas[index]

    inserted = 0
    updated = 0
    unchanged = 0
    deleted = 0

    for chunk in new_chunks:
        chunk_id = chunk["id"]
        new_hash = chunk["metadata"]["content_hash"]
        old_hash = existing_metadata_by_id.get(chunk_id, {}).get("content_hash")

        if chunk_id in existing_ids and old_hash == new_hash:
            unchanged += 1
            continue

        embedding = get_embedding(chunk["document"])

        collection.upsert(
            ids=[chunk_id],
            documents=[chunk["document"]],
            embeddings=[embedding],
            metadatas=[chunk["metadata"]]
        )

        if chunk_id in existing_ids:
            updated += 1
        else:
            inserted += 1

    delete_ids = list(existing_ids - new_ids)

    if delete_ids:
        collection.delete(ids=delete_ids)
        deleted = len(delete_ids)

    return {
        "inserted": inserted,
        "updated": updated,
        "unchanged": unchanged,
        "deleted": deleted,
        "total_generated_chunks": len(new_chunks),
        "total_existing_before": len(existing_ids)
    }


def process_latest_policy(bucket_name: str):
    latest_object, latest_version = get_latest_policy_object(bucket_name)

    print(f"Latest policy found: {latest_object}, version: v{latest_version}")

    pdf_text = read_pdf_from_gcs(bucket_name, latest_object)
    print("PDF extracted successfully")

    policy_map = extract_policy_map(pdf_text)
    print(f"Policy categories found: {list(policy_map.keys())}")

    products = fetch_active_products()
    print(f"Active products found: {len(products)}")

    chunks = build_product_policy_chunks(
        products=products,
        policy_map=policy_map,
        policy_file=latest_object,
        policy_version=latest_version
    )

    print(f"Product-policy chunks generated: {len(chunks)}")

    result = sync_to_chroma(chunks)

    print("Sync result:")
    print(json.dumps(result, indent=2))

    return result


@functions_framework.cloud_event
def rag_policy_loader(cloud_event: CloudEvent):
    data = cloud_event.data

    bucket_name = data.get("bucket")
    object_name = data.get("name")

    print(f"Received event for bucket={bucket_name}, object={object_name}")

    if bucket_name != BUCKET_NAME:
        print("Ignoring event from different bucket")
        return

    if not object_name.startswith(POLICY_PREFIX):
        print("Ignoring non-policy folder upload")
        return

    uploaded_version = extract_version(object_name)

    if uploaded_version is None:
        print("Ignoring file because name does not match version pattern")
        return

    latest_object, latest_version = get_latest_policy_object(bucket_name)

    if object_name != latest_object:
        print(f"Uploaded file is not latest. Uploaded v{uploaded_version}, latest v{latest_version}. Ignoring.")
        return

    result = process_latest_policy(bucket_name)

    print("RAG policy load completed")
    print(json.dumps(result, indent=2))