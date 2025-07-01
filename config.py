import os
from dotenv import load_dotenv

load_dotenv()  # Load .env file

class Config:
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    HOST = '0.0.0.0'
    PORT = 5000
    DEBUG = False
    
    # Performance
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB upload limit
    JSONIFY_PRETTYPRINT_REGULAR = True

    # API Keys (Example)
    OPENAI_KEY = os.getenv('OPENAI_KEY', '')