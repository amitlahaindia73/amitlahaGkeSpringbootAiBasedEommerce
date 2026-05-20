FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first for better layer caching.
COPY ai-recommendation-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai-recommendation-service /app

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
