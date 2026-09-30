"""Finance Agent: sub-agent untuk domain Finance."""
from agents.base_agent import BaseAgent


class FinanceAgent(BaseAgent):
    """
    Sub-agent untuk Finance: invoice, budget, AR/AP, pajak, laporan keuangan.
    Mewarisi retrieval logic dari BaseAgent.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
