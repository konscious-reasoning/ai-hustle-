import json
import csv
from pathlib import Path
from typing import Union, Dict, List

class DataHandler:
    @staticmethod
    def load_research() -> Dict:
        """Load market research data"""
        try:
            with open('data/research.json', 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Research load error: {e}")
            return {
                "error": "Data unavailable",
                "sample_data": {
                    "market_size": "$2.5B",
                    "top_niche": "AI Content Tools"
                }
            }

    @staticmethod
    def load_leads() -> List[Dict]:
        """Load lead data with error fallback"""
        try:
            with open('data/leads.csv', newline='') as f:
                return list(csv.DictReader(f))
        except:
            return [{
                "name": "Sample Lead",
                "email": "test@example.com",
                "niche": "AI Content Creation"
            }]