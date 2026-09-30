"""Sales Agent: sub-agent untuk domain Sales/CRM."""
from agents.base_agent import BaseAgent


class SalesAgent(BaseAgent):
    """
    Sub-agent untuk Sales: customer, order, pipeline, revenue, CRM.
    Mewarisi retrieval logic dari BaseAgent.
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
