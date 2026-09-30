"""Production Agent: sub-agent untuk domain Production."""
from agents.base_agent import BaseAgent


class ProductionAgent(BaseAgent):
    """
    Sub-agent untuk Production: jadwal produksi, output, downtime, OEE, batch.
    Mewarisi retrieval logic dari BaseAgent.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
