import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# --- MODEL CONFIGURATION ---
# Default to "nomic-embed-text" as per production requirements
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

# --- AZURE OPENAI CONFIGURATION ---
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
