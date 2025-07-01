import csv
from typing import List, Dict
from utils.data import load_leads
from utils.logger import log_dm_activity

class Outreach:
    def __init__(self):
        self.leads = load_leads()

    @log_dm_activity
    def generate_dms(self, lead_type: str = "cold") -> Dict:
        """Enhanced with lead filtering and personalization"""
        templates = {
            "cold": self._cold_template(),
            "warm": self._warm_template(),
            "followup": self._followup_template()
        }
        
        return {
            "template": templates.get(lead_type),
            "suggested_leads": self._filter_leads(lead_type),
            "optimal_send_times": ["9-11 AM", "2-4 PM"]
        }

    def _filter_leads(self, lead_type: str) -> List[Dict]:
        return [lead for lead in self.leads if lead['status'] == lead_type]

    def _cold_template(self) -> str:
        return ("Hey {name}, noticed your work in {niche}. "
                "Have you tried automating content repurposing?")

    def _warm_template(self) -> str:
        return ("Hi {name}, loved your post about {recent_post}! "
                "I've got a free tool that might help with {pain_point}.")