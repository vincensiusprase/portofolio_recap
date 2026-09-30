"""HR Agent: sub-agent untuk domain HR/SDM."""
from agents.base_agent import BaseAgent


class HRAgent(BaseAgent):
    """
    Sub-agent untuk HR: karyawan, cuti, gaji, payroll, KPI.
    Mewarisi retrieval logic dari BaseAgent.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
