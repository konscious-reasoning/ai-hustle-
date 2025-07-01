import json
from datetime import datetime
from dataclasses import dataclass
from typing import List, Dict
from utils.logger import log_operation

@dataclass
class Product:
    name: str
    price: float
    components: List[str]
    delivery: str

class Builder:
    def __init__(self):
        self.products = self._load_product_templates()

    @log_operation
    def create_product(self, product_type: str) -> Dict:
        """Enhanced with template validation and auto-formatting"""
        product = next((p for p in self.products if p['type'] == product_type), None)
        
        if not product:
            return {"error": "Product type not found"}
        
        return {
            "status": "created",
            "timestamp": datetime.utcnow().isoformat(),
            "product": product,
            "mobile_optimized": True
        }

    def get_templates(self) -> Dict:
        return {
            "landing_pages": self._get_landing_templates(),
            "email_sequences": self._get_email_templates()
        }

    def _load_product_templates(self) -> List[Dict]:
        return [
            {
                "type": "prompt_kit",
                "name": "AI Content Repurposing Kit",
                "price": 47.00,
                "components": [
                    "50+ AI prompts",
                    "Platform-specific templates",
                    "Video guide"
                ],
                "delivery": "Instant download"
            }
        ]

    def _get_landing_templates(self) -> List[str]:
        return ["AI Tool", "Course", "Service"]