import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Model name for Groq LLM
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
