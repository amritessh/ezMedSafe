⚕️ ezMedSafe - AI-Powered Drug Interaction & Adverse Event Early Warning System
Project Vision: To empower healthcare professionals with a highly contextual, explainable, and predictive AI-driven early warning system for drug interactions and adverse drug reactions. By seamlessly integrating robust backend data modeling, sophisticated AI agents, and a user-friendly, multi-page interface, ezMedSafe aims to significantly enhance patient safety, reduce preventable medication-related harm, and provide actionable, auditable insights into prescribing decisions.

MVP Goal (Approx. 13-14 Day Scope): Develop a functional, presentable, and architecturally sound proof-of-concept.

🌟 Key Features
User Management & Authentication: API Key Login for user authentication and session management. Includes an explicit User model managed by Prisma.
Patient & Medication Management: Fetches and displays a curated medication catalog. Allows input/selection of patient demographics and physiological statuses. Includes explicit Medication, PatientProfile, and Prescription models.
Core DDI & ADR Detection (AI Agents Orchestration): Users submit patient context and medications. An "Intelligent DDI/ADR Identification" (Clinical Pharmacist Agent) utilizes a Knowledge Graph Query (KGQ) Agent to query Neo4j for direct DDI relationships, mechanistic pathways, and patient-specific risk factors.
Explainable AI Alerts (RAG & LLMs): An Evidence Retrieval Agent (ERA) performs semantic search on Pinecone to retrieve evidence-based text snippets. An Explanation Generation Agent (EGA) uses a defined Model Context Protocol to structure gathered information and calls Google Gemini (gemini-pro) to synthesize a natural language, explainable alert, including mechanism, clinical implication, and actionable recommendation.
Alert History & Persistence: Each generated InteractionAlert (including inputs, AI output, and timestamp) is saved to the database and viewable on a dedicated "Alert History" page.
User Interface & Experience: Features a multi-page application with Login, Home (Interaction Checker), and Alert History pages, designed with intuitive forms and clear alert displays.
🛠️ Tech Stack
ezMedSafe leverages a modern microservices architecture with a robust set of technologies:


Programming Languages: Node.js (TypeScript), React (JavaScript), Python 
Backend Frameworks: Express.js 
Databases:
PostgreSQL: Hosted on Supabase (for relational data) 
Neo4j: Knowledge Graph Database 
Pinecone: Vector Database 
ORM: Prisma 
AI/ML & NLP: Google Gemini (gemini-pro, embedding-001), LangChain.js 
Message Broker: Apache Kafka (with Zookeeper) 

Caching: Redis 

Frontend Framework: React (with Vite) 
Frontend Routing: React Router DOM 
Styling: Tailwind CSS 
Containerization: Docker 
Orchestration: Kubernetes (K3s for MVP) 
CI/CD: Jenkins 
Monitoring: Prometheus, Grafana 

Centralized Logging: ELK Stack (Elasticsearch, Logstash/Filebeat, Kibana) 

Distributed Tracing: OpenTelemetry (with Jaeger) 

Version Control: Git (GitHub/GitLab) 
📐 Architecture Overview
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                  ezMedSafe System Architecture                                                                                                           |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

                                        (1) User Interaction (HTTP/HTTPS)
                                        +----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
                                        |  +---------------------+                                                                                                                                                                             |
                                        |  |                     |                                                                                                                                                                             |
                                        |  |    User (Browser)   |                                                                                                                                                                             |
                                        |  |    (React App)      |                                                                                                                                                                             |
                                        |  |                     |                                                                                                                                                                             |
                                        |  +----------+----------+                                                                                                                                                                             |
                                        |             |                                                                                                                                                                                         |
                                        |             | HTTP/HTTPS (Requests to Frontend Nginx, e.g., http://localhost:80)                                                                                                                  |
                                        |             |                                                                                                                                                                                         |
                                        |  +----------+----------+                                                                                                                                                                             |
                                        |  |                     |                                                                                                                                                                             |
                                        |  |   Frontend (Nginx)  | <-------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
                                        |  |   (Container)       |                                                                                                                                                                             |
                                        |  |   :80 (Host Port)   |                                                                                                                                                                             |
                                        |  |                     |                                                                                                                                                                             |
                                        |  +----------+----------+                                                                                                                                                                             |
                                        |             |                                                                                                                                                                                         |
                                        |             | Proxy API Requests (/api/*) to Backend Service (http://backend:3000)                                                                                                                  |
                                        |             | Serve UI (React App build) for other paths                                                                                                                                            |
                                        |             |                                                                                                                                                                                         |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                     Kubernetes Cluster (K3s) / Docker Compose Environment                                                                                  |
|                                                                                                                                                                                                                                          |
|  +--------------------------+                                                                                                                                                                                                            |
|  |                          |                                                                                                                                                                                                            |
|  |  (2) Backend Service     |                                                                                                                                                                                                            |
|  |  `ezmedsafe-backend-node`|                                                                                                                                                                                                            |
|  |  (Node.js / Express)     |                                                                                                                                                                                                            |
|  |  :3000 (Container Port)  |<-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|  |                          |                                                                                                                                                                                                            |
|  +-----+----+---------------+                                                                                                                                                                                                            |
|        |    |                                                                                                                                                                                                                            |
|        |    | API Calls (Internal to Docker Network)                                                                                                                                                                                       |
|        |    |                                                                                                                                                                                                                            |
|        |    |                                                                                                                                                                                                                            |
|  +-----+----v-----+         +--------------------------+          +--------------------------+          +--------------------------+                                                                                                |
|  |                  |         |                          |          |                          |          |                          |                                                                                                |
|  |  Supabase        |         |    Neo4j (Knowledge    |          |     Pinecone (Vector   |          |     Google Gemini        |                                                                                                |
|  |  (PostgreSQL)    |         |    Graph Database)     |          |     Database)          |          |     (LLM & Embeddings)   |                                                                                                |
|  |  (Cloud Service) |<------->|  `ezmedsafe-neo4j`     |<-------->|  (Cloud Service)       |<--------->|  (Cloud Service)         |                                                                                                |
|  |                  |         |  :7474/:7687           |          |                          |          |                          |                                                                                                |
|  +------------------+         +--------------------------+          +--------------------------+          +--------------------------+                                                                                                |
|                                                                                                                                                                                                                                          |
|  +--------------------------+                                                                                                                                                                                                            |
|  |                          |                                                                                                                                                                                                            |
|  |  Data-Prep Service       |                                                                                                                                                                                                            |
|  |  `ezmedsafe-data-prep`   |                                                                                                                                                                                                            |
|  |  (Python Script)         |<---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|  |  (Populates Pinecone     |                                                                                                                                                                                                            |
|  |   with Embeddings)       |                                                                                                                                                                                                            |
|  +--------------------------+                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                          |
|  +--------------------------+                                                                                                                                                                                                            |
|  |                          |                                                                                                                                                                                                            |
|  |  Redis (Caching)         |                                                                                                                                                                                                            |
|  |  `ezmedsafe-redis`       |                                                                                                                                                                                                            |
|  |  :6379                   |                                                                                                                                                                                                            |
|  +--------------------------+                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                          |
|  +--------------------------+                                                                                                                                                                                                            |
|  |                          |                                                                                                                                                                                                            |
|  |  Kafka (Message Broker)  |                                                                                                                                                                                                            |
|  |  `kafka` (with Zookeeper)|                                                                                                                                                                                                            |
|  |  :9092                   |                                                                                                                                                                                                            |
|  +--------------------------+                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                          |
|  +--------------------------+          +--------------------------+          +--------------------------+                                                                                                                            |
|  |                          |          |                          |          |                          |                                                                                                                            |
|  |  Prometheus (Metrics)    |          |    Grafana (Dashboards)  |          |    ELK Stack             |                                                                                                                            |
|  |  `prometheus`            |          |    `grafana`             |          |    (Elasticsearch,       |                                                                                                                            |
|  |  :9090                   |<--------->|    :3001                 |          |    Kibana, Filebeat)     |                                                                                                                            |
|  |                          |          |                          |          |    :9200/:5601           |                                                                                                                            |
|  +--------------------------+          +--------------------------+          +--------------------------+                                                                                                                            |
|                                                                                                                                                                                                                                          |
|  +--------------------------+                                                                                                                                                                                                            |
|  |                          |                                                                                                                                                                                                            |
|  |  Jaeger (Distributed)    |                                                                                                                                                                                                            |
|  |  Tracing                 |                                                                                                                                                                                                            |
|  |  `jaeger`                |                                                                                                                                                                                                            |
|  |  :16686                  |                                                                                                                                                                                                            |
|  +--------------------------+                                                                                                                                                                                                            |
|                                                                                                                                                                                                                                          |
|  +--------------------------+                                                                                                                                                                                                            |
|  |                          |                                                                                                                                                                                                            |
|  |  Jenkins (CI/CD)         |                                                                                                                                                                                                            |
|  |  `jenkins`               |                                                                                                                                                                                                            |
|  |  :8080                   |                                                                                                                                                                                                            |
|  +--------------------------+                                                                                                                                                                                                            |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
⚙️ Setup and Running (Overall Project)
Clone the Repository:

Bash

git clone https://github.com/your-repo/ezMedSafe.git # Replace with your actual repo URL
cd ezMedSafe
Prerequisites:

Docker Desktop (includes Docker Engine and optional Kubernetes/K3s)
Node.js (v18+) & npm
Python (v3.9+) & pip
Access to Supabase PostgreSQL Database credentials (URL, Anon Key, Service Key)
Access to Google Gemini API Key
Access to Pinecone API Key and Index Name
Access to Neo4j AuraDB URI, Username, and Password (if not using local Docker Compose Neo4j)
Environment Variables:
Create a .env file in the root ezMedSafe/ directory (or distribute per module if preferred, but a single root .env often simplifies Docker Compose):

# Root .env (example - actual values will be in module-specific .env files for Docker Compose)
# Backend
BACKEND_PORT=3000

# Supabase (PostgreSQL)
SUPABASE_URL="https://fdkmhvubulehmolbcudn.supabase.co" # Example
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_KEY="YOUR_SUPABASE_SERVICE_KEY"
DIRECT_DATABASE_URL="postgresql://postgres.fdkmhvubulehmolbcudn:YOUR_DB_PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres" # Direct connection for Prisma
DATABASE_URL="postgresql://postgres.fdkmhvubulehmolbcudn:YOUR_DB_PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true" # PGBouncer connection for Prisma

# Neo4j
NEO4J_URI="bolt://neo4j:7687" # For Docker Compose internal communication
NEO4J_USERNAME="neo4j"
NEO4J_PASSWORD="your_neo4j_password"

# Pinecone
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="ezmedsafe-rag-index"

# Google Gemini
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# API Key for authentication (if re-enabled, or for Postman testing)
API_KEY="1234"
Action: Ensure these values are also correctly passed to the individual service's .env files (e.g., ezmedsafe-backend-node/.env) if your docker-compose.yml uses env_file per service.
Database Migrations (Prisma):
Before starting the backend, ensure your PostgreSQL database schema is up-to-date.
Navigate to ezmedsafe-backend-node/ and run:

Bash

npm install # Install backend dependencies first
npx prisma migrate deploy
Build and Run the Entire Stack (Docker Compose):
From the root ezMedSafe/ directory:

Bash

docker-compose down --rmi all -v # Clean up old containers, images, and volumes
docker-compose up --build # Build images and start all services
This will build all service images and start the containers. This process can take several minutes, especially on the first run.
Wait until all containers show Up or (healthy) (check with docker-compose ps).
Accessing Services:

Frontend Application: http://localhost:80
Backend Health Check: http://localhost:3000/health (should return "ezMedSafe Backend OK")
Prometheus UI: http://localhost:9090
Grafana UI: http://localhost:3001 (Default login: admin/admin)
Kibana UI: http://localhost:5601
Jaeger UI: http://localhost:16686