
# 📊 ezMedSafe Data Preparation Service

This repository houses a standalone Python service dedicated to preparing data for the `ezMedSafe` AI agents. Its primary function is to generate vector embeddings from curated text data and upload them to the Pinecone vector database. This forms the Retrieval-Augmented Generation (RAG) knowledge base for the AI agents.

### 🌟 Key Functionalities

* **Data Curation:** Loads predefined text data related to drug interactions, mechanisms, and clinical implications.
* **Embedding Generation:** Utilizes Google Gemini's embedding model to convert text content into high-dimensional vector representations.
* **Vector Database Population:** Connects to Pinecone to upsert the generated embeddings along with relevant metadata, making them searchable by the AI agents.

### 🚀 Tech Stack

* **Language:** Python (3.9+)
* **Environment Management:** `pip` with `requirements.txt`
* **LLM/Embedding Integration:** `google-generativeai` library
* **Vector Database Client:** `pinecone-client` library
* **Environment Variables:** `python-dotenv` (for loading API keys securely)
* **Containerization:** Docker

### 📂 Project Structure

ezmedsafe-data-prep/
├── data/                    # Directory for raw data files (if applicable)
├── embed_rag_data.py        # Main Python script for data embedding and Pinecone upsertion
├── requirements.txt         # List of Python dependencies
├── .env                     # Environment variables specific to this service
└── Dockerfile               # Docker build instructions for the Python environment


### ⚙️ Setup and Running

**Prerequisites:**
* Python (3.9+) & pip
* Docker & Docker Compose
* Access to Google Gemini API Key
* Access to Pinecone API Key & Index Name

**Environment Variables (`.env`):**
Create a `.env` file in the `ezmedsafe-data-prep/` directory:

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
PINECONE_INDEX_NAME="ezmedsafe-rag-index" # Ensure this index exists in Pinecone


**Python Dependencies:**
Install all required Python packages:
```bash
pip install -r requirements.txt
```
Example requirements.txt content:
python-dotenv
google-generativeai
pinecone-client

**Running the Service:**

Via Docker Compose (Recommended for project setup): This service is designed to run as part of your main docker-compose up command. It will execute its CMD (typically python embed_rag_data.py) within its Docker container.

Locally (outside Docker Compose, for development/manual execution): From the ezmedsafe-data-prep/ directory:
Bash

python embed_rag_data.py

### 🐛 Troubleshooting
Check docker logs ezmedsafe-data-prep-1 for any Python runtime errors (e.g., ModuleNotFoundError).
Ensure all necessary environment variables are set correctly in the .env file.
Verify your Pinecone index exists and is configured for the correct dimension.
