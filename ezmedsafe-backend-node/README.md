# 🩺 ezMedSafe Backend Service

This repository contains the Node.js (Express.js, TypeScript) backend service for the ezMedSafe application. It serves as the central API, orchestrating data flow, AI agent interactions, and managing persistence.

### 🌟 Key Functionalities

* **API Endpoints:** Provides RESTful API endpoints for user authentication, medication catalog access, DDI checking, patient profile management, and alert history retrieval.
* **Data Layer Integration:** Connects to Supabase (PostgreSQL) via Prisma for relational data, Neo4j for the Knowledge Graph, and Pinecone for vector embeddings.
* **AI Agent Orchestration:** Manages the flow between the KGQ Agent, ERA Agent, and EGA Agent for intelligent DDI detection and explanation generation.
* **Authentication & Authorization:** Implements API key-based authentication for secure access to protected routes.
* **Asynchronous Messaging:** Publishes structured events to Kafka for downstream processing (e.g., real-time analytics, long-running tasks).
* **Caching:** Utilizes Redis for caching frequently accessed data (e.g., medication catalog, common DDI rules) to improve performance.
* **Observability:** Exposes Prometheus metrics via a `/metrics` endpoint and sends detailed logs to a centralized ELK stack via Filebeat.
* **Distributed Tracing:** Instrumented with OpenTelemetry to provide end-to-end request tracing that can be visualized in Jaeger.

### 🚀 Tech Stack

* **Language:** Node.js (TypeScript)
* **Framework:** Express.js
* **ORM:** Prisma
* **Databases:** PostgreSQL (via Prisma), Neo4j (via `neo4j-driver`), Pinecone (via `@pinecone-database/pinecone`)
* **AI/ML:** Google Gemini (via `@google/generative-ai`), LangChain.js
* **Message Broker Client:** `node-rdkafka` (for Kafka)
* **Caching:** `redis` client
* **Metrics:** `prom-client`
* **Tracing:** `@opentelemetry/sdk-node`, `@opentelemetry/exporter-trace-otlp-proto`
* **Logging:** `winston`
* **Environment Management:** `dotenv`

### 📂 Project Structure

```
ezmedsafe-backend-node/
├── src/
│   ├── agents/            # Implementations of AI agents (KGQAgent, ERAAgent, EGAAgent)
│   ├── clients/           # Database and AI client initializations (Prisma, Neo4j, Pinecone, Gemini, Redis, Kafka)
│   ├── middleware/        # Express middleware (e.g., authMiddleware.ts)
│   ├── routes/            # Defines API endpoints (auth.ts, medications.ts, interactions.ts, patientProfiles.ts, alertHistory.ts)
│   ├── services/          # Business logic services (e.g., interactionService.ts)
│   ├── types/             # TypeScript interfaces and types for the application
│   ├── tracing.ts         # OpenTelemetry tracing initialization
│   └── server.ts          # Main Express application entry point and server setup
├── prisma/                # Prisma schema (schema.prisma) and database migration files
├── dist/                  # Compiled JavaScript output
├── .env                   # Environment variables (local development)
├── Dockerfile             # Docker build instructions for the backend service
├── package.json           # Node.js dependencies and scripts
└── tsconfig.json          # TypeScript compiler configuration
```

### ⚙️ Setup and Running

**Dependencies (ensure these Docker Compose services are running):**
* Neo4j
* Redis
* Kafka (with Zookeeper)
* Prometheus
* Grafana
* Elasticsearch
* Kibana
* Filebeat
* Jaeger


###Database Migrations (Prisma):
From the ezmedsafe-backend-node/ directory:

```
npm install
npx prisma migrate deploy # Apply database schema migrations to PostgreSQL
```

Running the Server:

Via Docker Compose (Recommended for full stack): The docker-compose.yml in the root will build and run this service. Its command is npm start.
Locally for Development (outside Docker Compose): From ezmedsafe-backend-node/ directory:
Bash

```
npm install
npm run dev # Starts the server with hot-reloading
npm start   # Starts the compiled production build
```

Note: If running locally, ensure external services (Neo4j, Redis, Kafka) are accessible on localhost (e.g., NEO4J_URI=bolt://localhost:7687, REDIS_URL=redis://localhost:6379, KAFKA_BROKER=localhost:9092).


**Environment Variables (`.env`):**
Ensure your `ezmedsafe-backend-node/.env` file has the following (values are usually passed from the root `.env`):

```dotenv
PORT=3000
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_KEY="YOUR_SUPABASE_SERVICE_KEY"
DIRECT_DATABASE_URL="postgresql://postgres.abcdabcd:YOUR_DB_PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
DATABASE_URL="postgresql://postgres.abcdabcd:YOUR_DB_PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEO4J_URI="bolt://neo4j:7687"
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your_neo4j_password"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="ezmedsafe-rag-index"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
API_KEY="1234"
KAFKA_BROKER="kafka:9092"
KAFKA_CLIENT_ID="ezmedsafe-backend"
KAFKA_ALERTS_TOPIC="interaction_alerts_generated"
KAFKA_CONNECTION_TIMEOUT=30000
REDIS_URL="redis://redis:6379"
```


🔌 API Endpoints
All API endpoints are prefixed with /api. For example, http://localhost:3000/api/auth/login.
```
GET /health: Basic server health check.
GET /metrics: Prometheus metrics endpoint (exposes application and Node.js process metrics).
POST /api/auth/login: Handles user login.
GET /api/medications: Retrieves the medication catalog.
POST /api/check-interactions: Submits patient and medication data for DDI checks.
POST /api/patient-profiles: Creates a new patient profile.
GET /api/patient-profiles: Retrieves all patient profiles for the authenticated user.
GET /api/alerts/history: Fetches historical interaction alerts for the authenticated user.
```

📊 Monitoring & Tracing
Prometheus Metrics: The backend exposes custom application metrics (e.g., API request count/latency, LLM call count/latency) and default Node.js process metrics at the /metrics endpoint.
Centralized Logging: Logs from this service are collected by Filebeat and sent to Elasticsearch, viewable in Kibana.
Distributed Tracing: Requests flowing through this backend are traced using OpenTelemetry and can be visualized in Jaeger.