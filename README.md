# ⚕️ ezMedSafe - AI-Powered Drug Interaction & Adverse Event Early Warning System

**Project Vision:** To empower healthcare professionals with a highly contextual, explainable, and predictive AI-driven early warning system for drug interactions and adverse drug reactions. By seamlessly integrating robust backend data modeling, sophisticated AI agents, and a user-friendly, multi-page interface, ezMedSafe aims to significantly enhance patient safety, reduce preventable medication-related harm, and provide actionable, auditable insights into prescribing decisions.

**MVP Goal:** Develop a functional, presentable, and architecturally sound proof-of-concept within a 13-14 day scope.

### ✨ Key Features

* **User Management & Authentication:** API Key Login for user authentication and basic session management. User data is managed by Prisma.
* **Patient & Medication Management:** Fetches and displays a curated medication catalog. Allows input/selection of patient demographics and physiological statuses. Includes explicit `Medication`, `PatientProfile`, and `Prescription` models.
* **Core DDI & ADR Detection (AI Agents Orchestration):** Users submit patient context and medications.
    * **Knowledge Graph Query (KGQ) Agent:** Queries Neo4j to identify direct DDI relationships, mechanistic pathways, and patient-specific risk factors.
* **Explainable AI Alerts (RAG & LLMs):**
    * **Evidence Retrieval Agent (ERA):** Performs semantic search on Pinecone (vector DB) to retrieve relevant, evidence-based text snippets.
    * **Explanation Generation Agent (EGA):** Calls Google Gemini to synthesize KG data and RAG text into natural language, explainable alerts. Output includes: precise mechanism, clinical implication, and actionable recommendation.
* **Alert History & Persistence:** Each generated `InteractionAlert` is saved to the database (via Prisma to Supabase) and viewable on a dedicated "Alert History" page.
* **User Interface & Experience:** Multi-page React application with Login, Home (Interaction Checker), and Alert History pages, featuring intuitive forms and clear alert displays.
* **Observability:** Includes Prometheus for metrics, Grafana for visualization, ELK Stack (Elasticsearch, Kibana, Filebeat) for centralized logging, and OpenTelemetry with Jaeger for distributed tracing.
* **Message Broker & Caching:** Utilizes Apache Kafka for asynchronous event streaming and Redis for caching frequently accessed data.

### 🛠️ Tech Stack

ezMedSafe leverages a modern microservices architecture with a robust set of technologies:

* **Programming Languages:** Node.js (TypeScript), React (JavaScript), Python
* **Backend Frameworks:** Express.js
* **Databases:** PostgreSQL (Supabase), Neo4j, Pinecone
* **ORM:** Prisma
* **AI/ML & NLP:** Google Gemini, LangChain.js
* **Message Broker:** Apache Kafka (with Zookeeper)
* **Caching:** Redis
* **Frontend Framework:** React (with Vite)
* **Frontend Routing:** React Router DOM
* **Styling:** Tailwind CSS
* **Containerization:** Docker
* **Orchestration:** Kubernetes (K3s)
* **CI/CD:** Jenkins
* **Monitoring:** Prometheus, Grafana
* **Centralized Logging:** ELK Stack (Elasticsearch, Logstash/Filebeat, Kibana)
* **Distributed Tracing:** OpenTelemetry (with Jaeger)
* **Version Control:** Git

### 📐 Architecture Overview




### ⚙️ Setup and Running (Overall Project)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-repo/ezMedSafe.git](https://github.com/your-repo/ezMedSafe.git) # Replace with your actual repo URL
    cd ezMedSafe
    ```

2.  **Prerequisites:**
    * [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Engine and built-in Kubernetes)
    * Node.js (v18+) & npm
    * Python (v3.9+) & pip
    * Access to Supabase PostgreSQL Database credentials (URL, Anon Key, Service Key)
    * Access to Google Gemini API Key
    * Access to Pinecone API Key and Index Name
    * Access to Neo4j AuraDB URI, Username, and Password (if not using local Docker Compose Neo4j)

3.  **Environment Variables:**
    Create a `.env` file in the root `ezMedSafe/` directory (these are loaded by individual service `.env` files within Docker Compose):

    ```dotenv
    # Backend
    BACKEND_PORT=3000

    # Supabase (PostgreSQL)
    SUPABASE_URL="[https://fdkmhvubulehmolbcudn.supabase.co](https://fdkmhvubulehmolbcudn.supabase.co)" # Example
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

    # Redis (for Docker Compose internal communication)
    REDIS_URL="redis://redis:6379"

    # Kafka (for Docker Compose internal communication)
    KAFKA_BROKER="kafka:9092"
    KAFKA_CLIENT_ID="ezmedsafe-backend"
    KAFKA_ALERTS_TOPIC="interaction_alerts_generated"
    KAFKA_CONNECTION_TIMEOUT=30000
    ```

4.  **Database Migrations (Prisma):**
    Before starting the backend, ensure your PostgreSQL database schema is up-to-date.
    Navigate to `ezmedsafe-backend-node/` and run:
    ```bash
    npm install # Install backend dependencies first
    npx prisma migrate deploy # Apply database schema migrations to PostgreSQL
    ```

5.  **Build and Run the Entire Stack (Docker Compose):**
    From the root `ezMedSafe/` directory:
    ```bash
    docker-compose down --rmi all -v # Clean up old containers, images, and volumes
    docker-compose up --build # Build images and start all services
    ```
    * This will build all service images and start the containers. This process can take several minutes, especially on the first run.
    * **Wait until all containers show `Up` or `(healthy)`** (check with `docker-compose ps`).

6.  **Accessing Services:**
    * **Frontend Application:** `http://localhost:80`
    * **Backend Health Check:** `http://localhost:3000/health` (should return "ezMedSafe Backend OK")
    * **Prometheus UI:** `http://localhost:9090`
    * **Grafana UI:** `http://localhost:3001` (Default login: `admin`/`admin`)
    * **Kibana UI:** `http://localhost:5601`
    * **Jaeger UI:** `http://localhost:16686`
    * **Jenkins UI:** `http://localhost:8080`

