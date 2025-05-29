import os
import google.generativeai as genai
from pinecone import Pinecone,Index
from uuid import uuid4
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME","ezmedsafe-rag-index")

if not all([GEMINI_API_KEY,PINECONE_API_KEY]):
    raise ValueError("Missing required environment variables for Gemini or Pinecone")


genai.configure(api_key=GEMINI_API_KEY)

pc = Pinecone(api_key=PINECONE_API_KEY)

try:
    pc.describe_index(PINECONE_INDEX_NAME)
    print(f"Pinecone index '{PINECONE_INDEX_NAME}' with dimension 768...")
except:
    print(f"Creating Pinecone index'{PINECONE_INDEX_NAME}' with dimension 768...")
    pc.create_index(name=PINECONE_INDEX_NAME, dimension = 768, metric ='cosine')
    print(f"Pinecone index '${PINECONE_INDEX_NAME}' created.")

index = pc.Index(PINECONE_INDEX_NAME)


data_to_embed = [
    {
        "text": "Warfarin, a vitamin K antagonist, is primarily metabolized by CYP2C9. Genetic variations in CYP2C9 can significantly alter warfarin metabolism, requiring individualized dosing.",
        "metadata": {"drug_a": "Warfarin", "mechanism_type": "Metabolism", "enzyme": "CYP2C9"}
    },
    {
        "text": "Fluconazole is a potent inhibitor of cytochrome P450 2C9 (CYP2C9) and 2C19 (CYP2C19) enzymes. This inhibition can lead to increased plasma concentrations of co-administered drugs metabolized by these enzymes.",
        "metadata": {"drug_a": "Fluconazole", "mechanism_type": "Enzyme Inhibition", "enzyme": "CYP2C9"}
    },
    {
        "text": "The co-administration of fluconazole with warfarin can result in significant increases in warfarin's anticoagulant effect, leading to an elevated risk of bleeding. Close monitoring of International Normalized Ratio (INR) is crucial.",
        "metadata": {"drug_a": "Warfarin", "drug_b": "Fluconazole", "interaction_type": "DDI", "clinical_implication": "Increased Bleeding Risk"}
    },
    {
        "text": "Ondansetron is known to prolong the QT interval in a dose-dependent manner. This effect can be additive when co-administered with other drugs that also prolong the QT interval.",
        "metadata": {"drug_a": "Ondansetron", "mechanism_type": "QT Prolongation", "target_pathway": "Cardiac Ion Channels"}
    },
    {
        "text": "Dofetilide is an antiarrhythmic drug with a narrow therapeutic index that primarily prolongs the QT interval. Concomitant use with other QT-prolonging agents can lead to life-threatening ventricular arrhythmias, including Torsades de Pointes.",
        "metadata": {"drug_a": "Dofetilide", "mechanism_type": "QT Prolongation", "target_pathway": "Cardiac Ion Channels"}
    },
    {
        "text": "The concurrent use of Ondansetron and Dofetilide is generally contraindicated due to the additive risk of severe QT interval prolongation and the potential for Torsades de Pointes, a life-threatening ventricular arrhythmia.",
        "metadata": {"drug_a": "Ondansetron", "drug_b": "Dofetilide", "interaction_type": "DDI", "clinical_implication": "Risk of Torsades de Pointes"}
    }
]



vectors_to_upsert = []
for item in data_to_embed:
    text_content = item["text"]
    metadata = item["metadata"]
    embedding_response = genai.embed_content(
        model="embedding-001", 
        content=text_content
    )
    embedding = embedding_response['embedding'] 
    vectors_to_upsert.append({"id": str(uuid4()), "values": embedding, "metadata": metadata})


try:
    index.upsert(vectors=vectors_to_upsert)
    print(f"Successfully upserted {len(vectors_to_upsert)} vectors to Pinecone.")
except Exception as e:
    print(f"Error upserting to Pinecone: {e}")