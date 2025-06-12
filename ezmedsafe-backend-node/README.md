# ⚕️ ezMedSafe
## AI-Powered Drug Interaction & Adverse Event Early Warning System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-required-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/typescript-4.9%2B-blue.svg)](https://www.typescriptlang.org/)

> **🎯 Project Vision:** Empower healthcare professionals with a highly contextual, explainable, and predictive AI-driven early warning system for drug interactions and adverse drug reactions. By seamlessly integrating robust backend data modeling, sophisticated AI agents, and a user-friendly interface, ezMedSafe aims to significantly enhance patient safety and reduce preventable medication-related harm.

**MVP Timeline:** 13-14 days | **Status:** In Development

## 🌟 Features

### 🔐 Core Platform
- **Secure Authentication** - API Key-based login with session management
- **Patient Management** - Comprehensive patient profiles with demographics and medical history
- **Medication Catalog** - Curated drug database with detailed pharmacological data
- **Multi-page Interface** - Intuitive React application with dedicated workflows

### 🤖 AI-Powered Detection Engine
- **Knowledge Graph Queries** - Neo4j-powered relationship mapping for drug interactions
- **Semantic Search** - Pinecone vector database for evidence-based literature retrieval  
- **Explainable AI** - Google Gemini integration for natural language explanations
- **Real-time Alerts** - Instant DDI/ADR detection with clinical recommendations

### 📊 Enterprise Features
- **Alert History** - Persistent storage and audit trail of all interactions
- **Advanced Monitoring** - Prometheus metrics, Grafana dashboards, ELK logging
- **Message Streaming** - Apache Kafka for scalable event processing
- **High Performance** - Redis caching for sub-second response times

### 🔮 Model Context Protocol (MCP) Integration
**Integral to its advanced AI architecture**, ezMedSafe leverages the **Model Context Protocol (MCP)**, an open standard, open-source framework (introduced by Anthropic in November 2024) that standardizes how AI models integrate and share data with external tools, systems, and data sources. The EGA Agent orchestrates the Google Gemini LLM's interactions by enabling it to make structured tool calls to the KGQ Agent and ERA Agent, and process their standardized results in a multi-turn reasoning process. This fundamental integration ensures robust, interoperable, and formalized LLM orchestration and tool utilization within the system.

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        A[User Browser<br/>React App]
    end

    subgraph Frontend["🎨 Frontend"]
        B[Nginx<br/>:80<br/>Static Assets<br/>API Proxy]
    end

    subgraph Backend["⚙️ Backend Services"]
        C[Node.js API<br/>:3000<br/>Express + TypeScript]
        D[Data Prep<br/>Python Service<br/>Vector Embeddings]
    end

    subgraph Storage["💾 Data Layer"]
        E[(Supabase<br/>PostgreSQL<br/>Primary DB)]
        F[(Neo4j<br/>Knowledge Graph<br/>:7474/:7687)]
        G[(Pinecone<br/>Vector Search<br/>Cloud)]
        H[(Redis<br/>Cache<br/>:6379)]
    end

    subgraph AI["🤖 AI Services"]
        I[Google Gemini<br/>LLM & Embeddings<br/>Cloud API]
    end

    subgraph Queue["📨 Messaging"]
        J[Apache Kafka<br/>:9092<br/>+ Zookeeper]
    end

    subgraph Monitor["📊 Observability"]
        K[Prometheus<br/>:9090]
        L[Grafana<br/>:3001]
        M[ELK Stack<br/>Elasticsearch :9200<br/>Kibana :5601]
        N[Jaeger<br/>Tracing<br/>:16686]
    end

    subgraph CICD["🔧 CI/CD"]
        O[Jenkins<br/>:8080]
    end

    A -->|HTTPS| B
    B -->|/api/*| C
    C --> E
    C --> F
    C --> G
    C --> H
    C --> I
    C --> J
    D --> G
    D --> I
    K --> L
    C --> K
    C --> M
    C --> N

    style A fill:#e1f5fe
    style I fill:#f3e5f5
    style E fill:#e8f5e8
    style F fill:#fff3e0
    style G fill:#fce4ec
```

## 🛠️ Technology Stack

### Backend & APIs
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?style=flat&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.18+-000000?style=flat&logo=express&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)

### Frontend & UI
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-4.0+-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6+-CA4245?style=flat&logo=react-router&logoColor=white)

### Databases & Storage
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j-4.4+-008CC1?style=flat&logo=neo4j&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-FF6B6B?style=flat)
![Redis](https://img.shields.io/badge/Redis-7.0+-DC382D?style=flat&logo=redis&logoColor=white)

### AI & Machine Learning
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain.js-1C3C3C?style=flat)
![MCP](https://img.shields.io/badge/Model_Context_Protocol-FF6B35?style=flat)

### Infrastructure & DevOps
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)
![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=flat&logo=apache-kafka&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat&logo=nginx&logoColor=white)

### Monitoring & Observability
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat&logo=grafana&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?style=flat&logo=elasticsearch&logoColor=white)
![Kibana](https://img.shields.io/badge/Kibana-005571?style=flat&logo=kibana&logoColor=white)
![Jaeger](https://img.shields.io/badge/Jaeger-66CFE3?style=flat)

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- ![Docker](https://img.shields.io/badge/Docker_Desktop-2496ED?style=flat&logo=docker&logoColor=white) **Docker Desktop** (includes Kubernetes)
- ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white) **Node.js 18+**
- ![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white) **Python 3.9+**

### API Keys Required

You'll need access to these services:
- **Supabase** (PostgreSQL hosting)
- **Google Gemini API** (AI/ML)
- **Pinecone** (Vector database)
- **Neo4j AuraDB** (Optional - can use Docker)

### 📥 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/amritessh/ezMedSafe.git
   cd ezMedSafe
   ```

2. **Environment setup**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your credentials:
   ```env
   # Backend
   BACKEND_PORT=3000

   # Supabase (PostgreSQL)
   SUPABASE_URL="https://fdkmhvubulehmolbcudn.supabase.co" # Example
   SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
   SUPABASE_SERVICE_KEY="YOUR_SUPABASE_SERVICE_KEY"
   DIRECT_DATABASE_URL="postgresql://postgres.fdkmhvubulehmolbcudn:YOUR_DB_PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
   DATABASE_URL="postgresql://postgres.fdkmhvubulehmolbcudn:YOUR_DB_PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

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

3. **Database setup**
   ```bash
   cd ezmedsafe-backend-node
   npm install
   npx prisma migrate deploy
   cd ..
   ```

4. **Launch the application**
   ```bash
   # Clean any existing containers
   docker-compose down --rmi all -v
   
   # Build and start all services
   docker-compose up --build
   ```

   ⏱️ **Initial startup takes 3-5 minutes**. Wait for all services to show `Up` status:
   ```bash
   docker-compose ps
   ```

### 🌐 Access Points

Once running, access these services:

| Service | URL | Purpose |
|---------|-----|---------|
| **🏠 Main Application** | http://localhost | Primary user interface |
| **⚕️ Backend API** | http://localhost:3000/health | API health check |
| **📊 Grafana** | http://localhost:3001 | Metrics dashboard (admin/admin) |
| **🔍 Kibana** | http://localhost:5601 | Log analysis |
| **📈 Prometheus** | http://localhost:9090 | Metrics collection |
| **🔍 Jaeger** | http://localhost:16686 | Distributed tracing |
| **🔧 Jenkins** | http://localhost:8080 | CI/CD pipeline |

## 📝 Usage

### Basic Workflow

1. **Login** - Use your configured API key to authenticate
2. **Patient Setup** - Create or select a patient profile
3. **Medication Entry** - Add current medications from the catalog
4. **Analysis** - Submit for AI-powered interaction analysis
5. **Review Alerts** - Examine detailed explanations and recommendations
6. **History** - Access previous analyses in the Alert History page

### API Testing

Test the backend directly using curl:

```bash
# Health check
curl http://localhost:3000/health

# Get medications (requires API key)
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/medications

# Check drug interactions
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "patientId": "patient_id",
    "medications": ["drug1_id", "drug2_id"]
  }'
```

## 🔧 Development

### Project Structure

```
ezMedSafe/
├── ezmedsafe-frontend/          # React frontend application
├── ezmedsafe-backend-node/      # Node.js/Express API server
├── ezmedsafe-data-prep/         # Python data processing service
├── docker-compose.yml           # Multi-service orchestration
├── k8s/                         # Kubernetes deployment manifests
├── monitoring/                  # Prometheus, Grafana configs
├── .env                         # Environment variables
└── README.md                    # This file
```

### Running Individual Services

**Frontend Development:**
```bash
cd ezmedsafe-frontend
npm install
npm run dev  # Vite dev server on :5173
```

**Backend Development:**
```bash
cd ezmedsafe-backend-node
npm install
npm run dev  # Nodemon on :3000
```

**Data Processing:**
```bash
cd ezmedsafe-data-prep
pip install -r requirements.txt
python app.py
```

### Database Management

**Prisma Commands:**
```bash
cd ezmedsafe-backend-node

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database
npx prisma studio
```

## 🧪 Testing

### Unit Tests
```bash
# Backend tests
cd ezmedsafe-backend-node
npm test

# Frontend tests  
cd ezmedsafe-frontend
npm test
```

### Integration Tests
```bash
# Full stack testing with test containers
docker-compose -f docker-compose.test.yml up --build
```

### Load Testing
```bash
# Using k6 for API load testing
k6 run scripts/load-test.js
```

## 📊 Monitoring & Observability

### Metrics (Prometheus + Grafana)

- **Application Metrics:** Request latency, error rates, throughput
- **Business Metrics:** Interactions checked, alerts generated, user activity
- **Infrastructure Metrics:** CPU, memory, disk usage across services

### Logging (ELK Stack)

- **Structured Logging:** JSON format with correlation IDs
- **Log Aggregation:** Centralized via Filebeat → Elasticsearch
- **Log Analysis:** Search and visualization in Kibana

### Distributed Tracing (Jaeger)

- **Request Tracing:** End-to-end request flow visualization
- **Performance Analysis:** Bottleneck identification
- **Error Tracking:** Exception propagation across services

## 🐳 Deployment

### Docker Compose (Development)
```bash
docker-compose up --build
```

### Kubernetes (Production)
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ezmedsafe

# View logs
kubectl logs -f deployment/ezmedsafe-backend -n ezmedsafe
```

### CI/CD Pipeline

The Jenkins pipeline automatically:
1. **Build** - Creates Docker images for all services
2. **Test** - Runs unit and integration tests
3. **Deploy** - Updates Kubernetes deployments
4. **Monitor** - Validates deployment health

## 🛠️ Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check Docker resources
docker system df
docker system prune -a  # Clean up if needed

# Check logs
docker-compose logs [service-name]
```

**Database connection errors:**
```bash
# Verify environment variables
grep DATABASE_URL .env

# Test connection
docker-compose exec backend npm run db:test
```

**Memory issues:**
```bash
# Increase Docker memory allocation
# Docker Desktop → Settings → Resources → Memory (8GB+)
```

### Health Checks

Monitor service health:
```bash
# All services status
docker-compose ps

# Individual service health
curl http://localhost:3000/health
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:9200/_cluster/health  # Elasticsearch
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript** for backend with strict mode
- **ESLint + Prettier** for code formatting
- **Jest** for unit testing
- **Conventional Commits** for commit messages
- **100% test coverage** for critical paths

### Documentation

- Update README for new features
- Add inline code comments for complex logic
- Update API documentation in Swagger/OpenAPI format
- Include deployment notes for infrastructure changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenFDA** for drug interaction data
- **Anthropic** for Model Context Protocol inspiration
- **Healthcare community** for domain expertise
- **Open source contributors** for the amazing tools used

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/amritessh/ezMedSafe/issues)
- **Discussions:** [GitHub Discussions](https://github.com/amritessh/ezMedSafe/discussions)
- **Email:** support@ezmedsafe.dev

---

<div align="center">

**🚀 Built with passion for healthcare innovation**

[⭐ Star this repo](https://github.com/amritessh/ezMedSafe) • [🐛 Report bug](https://github.com/amritessh/ezMedSafe/issues) • [💡 Request feature](https://github.com/amritessh/ezMedSafe/issues)

</div>