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

### 🔮 Future-Ready Architecture
- **Model Context Protocol** - Prepared for MCP standard integration
- **Microservices Design** - Kubernetes-ready containerized services
- **CI/CD Pipeline** - Jenkins automation for continuous deployment

## 🛠️ Tech Stack

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

## 📐 Architecture Overview

```mermaid
graph TB
    subgraph Client["Client Layer"]
        A[User Browser<br/>React App]
    end

    subgraph Frontend["Frontend Service"]
        B[Nginx<br/>Port 80<br/>Serves React App<br/>Proxies /api/* to backend]
    end

    subgraph Backend["Backend Services"]
        C[Node.js/Express API<br/>ezmedsafe-backend-node<br/>Port 3000]
        D[Data Prep Service<br/>ezmedsafe-data-prep<br/>Python]
    end

    subgraph Storage["Data Storage Layer"]
        E[(Supabase<br/>PostgreSQL<br/>Cloud Service)]
        F[(Neo4j<br/>Knowledge Graph<br/>7474/7687)]
        G[(Pinecone<br/>Vector DB<br/>Cloud Service)]
        H[(Redis<br/>Cache<br/>6379)]
    end

    subgraph AI["AI/ML Services"]
        I[Google Gemini<br/>LLM & Embeddings<br/>Cloud Service]
    end

    subgraph Queue["Message Queue"]
        J[Kafka<br/>9092<br/>+ Zookeeper]
    end

    subgraph Monitor["Monitoring & Observability"]
        K[Prometheus<br/>9090]
        L[Grafana<br/>3001]
        M[ELK Stack<br/>Elasticsearch 9200<br/>Kibana 5601]
        N[Jaeger<br/>Tracing<br/>16686]
    end

    subgraph CICD["CI/CD"]
        O[Jenkins<br/>8080]
    end

    A -->|HTTP/HTTPS| B
    B -->|Proxy /api/*| C
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
```

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
   # Backend Configuration
   BACKEND_PORT=3000
   
   # Supabase (PostgreSQL)
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your_supabase_anon_key"
   SUPABASE_SERVICE_KEY="your_supabase_service_key"
   DIRECT_DATABASE_URL="postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:5432/postgres"
   DATABASE_URL="postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   # Neo4j Configuration
   NEO4J_URI="bolt://neo4j:7687"
   NEO4J_USERNAME="neo4j"
   NEO4J_PASSWORD="your_neo4j_password"
   
   # Pinecone Vector Database
   PINECONE_API_KEY="your_pinecone_api_key"
   PINECONE_INDEX_NAME="ezmedsafe-rag-index"
   
   # Google Gemini AI
   GEMINI_API_KEY="your_gemini_api_key"
   
   # Authentication
   API_KEY="your_secure_api_key"
   
   # Redis & Kafka (Docker internal)
   REDIS_URL="redis://redis:6379"
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