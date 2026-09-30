"""FMEA Agent: sub-agent untuk domain maintenance/FMEA."""
from agents.base_agent import BaseAgent


class FMEAAgent(BaseAgent):
    """
    Sub-agent untuk FMEA & maintenance.
    Mewarisi semua retrieval logic dari BaseAgent.
    Bisa di-override untuk custom behavior spesifik FMEA.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override max_context_chunks khusus FMEA jika perlu
        # Default dari registry: 3 FMEA maksimum di konteks
