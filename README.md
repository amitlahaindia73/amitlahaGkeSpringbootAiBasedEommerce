# Amitra Commerce Mesh

Enterprise-style AI-powered e-commerce microservices platform deployed on Google Cloud Platform (GCP).

## Architecture

Frontend:
- React + Next.js BFF

Backend Microservices:
- API Gateway (Spring Cloud Gateway)
- User Service
- Product Service
- Cart Service
- Order Service
- Payment Service
- Delivery Service
- Notification Service
- AI Recommendation Service (Python FastAPI)
- AI Support Chat Service (Python FastAPI)

Infrastructure:
- Kubernetes (GKE)
- Docker
- Jenkins CI/CD
- Kafka
- Redis
- MySQL
- MongoDB
- Keycloak Authentication
- Google Cloud Platform

## Key Features

- JWT/OAuth2 Authentication
- API Gateway Routing
- Kafka Event Driven Communication
- Redis Rate Limiting
- AI Recommendation Engine
- AI Customer Support Chat
- Microservice Architecture
- CI/CD Deployment Pipeline
- Kubernetes Deployment
- Secure Cloud Architecture

## Technology Stack

### Backend
- Java 21
- Spring Boot
- Spring Cloud
- Spring Security
- JPA/Hibernate

### Frontend
- React
- Next.js

### AI Services
- Python
- FastAPI
- Gemini AI Integration

### Cloud & DevOps
- Google Cloud Platform
- GKE
- Docker
- Jenkins
- Artifact Registry

## Project Structure

- `/api-gateway` -> Central API Gateway
- `/nextjs-bff` -> Frontend BFF Layer
- `/user-service` -> User Management
- `/product-service` -> Product Catalog
- `/cart-service` -> Cart Operations
- `/order-service` -> Order Processing
- `/payment-service` -> Payment Flow
- `/delivery-service` -> Delivery Tracking
- `/notification-service` -> Notifications
- `/ai-recommendation-service` -> AI Product Recommendation
- `/ai-order-support-service` -> AI Customer Support

## Security Notice

All sensitive credentials, tokens, secrets, and environment-specific information have been removed from this public repository version.

## CI/CD Flow

GitHub -> Jenkins -> Docker Build -> Artifact Registry -> GKE Deployment

## Deployment

The application is containerized using Docker and deployed to Kubernetes (GKE).

## Author

Amit Laha
