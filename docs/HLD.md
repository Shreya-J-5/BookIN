# BookIN — High-Level Design (HLD)

## 1. System Overview

BookIN is a high-concurrency movie ticket booking platform modeled after BookMyShow. The core objective is to deliver sub-second discovery, interactive tiered seat maps, real-time availability sync, and 100% collision-free seat reservation under peak ticket drops.

```
                  ┌─────────────────────────────────────────┐
                  │          React 18 SPA Frontend          │
                  │   (Customer Web / Admin / Theatre Ops)  │
                  └────────────────────┬────────────────────┘
                                       │
                              HTTP / WebSocket
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │           NGINX Reverse Proxy           │
                  │         Rate Limiting & SSL Offload     │
                  └────────────────────┬────────────────────┘
                                       │
                   ┌───────────────────┴───────────────────┐
                   │                                       │
                   ▼                                       ▼
     ┌───────────────────────────┐           ┌───────────────────────────┐
     │  FastAPI GraphQL Engine   │           │   WebSocket Hub (/ws)     │
     │  (Strawberry GraphQL API) │           │   Real-time Seat Updates  │
     └─────────────┬─────────────┘           └─────────────┬─────────────┘
                   │                                       │
                   ├───────────────────────────────────────┤
                   ▼                                       ▼
     ┌───────────────────────────┐           ┌───────────────────────────┐
     │   PostgreSQL (Single DB)  │           │      Redis & Celery       │
     │   ACID, SELECT FOR UPDATE │           │  Pub/Sub & Worker Queue   │
     │   Row-level Locks & State │           │  Cache & Expiry Cleanup   │
     └───────────────────────────┘           └───────────────────────────┘
```

## 2. Key Architecture Pillars

### 2.1 Single Primary Database
PostgreSQL is the single authoritative source of truth. All transactional state changes (locks, holds, payments, ticket issuance) execute inside PostgreSQL ACID transactions with serializable or read-committed isolation and row-level locks (`SELECT ... FOR UPDATE`).

### 2.2 GraphQL-First Application API
The client interacts primarily with `/graphql` for queries and mutations. The GraphQL layer handles schema validation, authentication context injection, role-based authorization, and dataloading to eliminate N+1 query bottlenecks.

### 2.3 Real-Time WebSocket Synchronization
When any user reserves or releases a seat, an event is emitted through a WebSocket channel `/ws/shows/{show_id}` so all clients currently viewing that show's seat map immediately see seats turn yellow (locked) or red (booked) without polling.

### 2.4 Scalability & Reliability
- Stateless application workers behind Nginx load balancing.
- PostgreSQL connection pooling via SQLAlchemy poolers.
- Asynchronous background tasks (email ticket dispatch, expired hold sweep) via Celery and asyncio background workers.

