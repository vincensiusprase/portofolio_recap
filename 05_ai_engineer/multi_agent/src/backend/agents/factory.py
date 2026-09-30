"""Factory: buat instance sub-agent dari registry config."""
from __future__ import annotations

import os

import yaml
from openai import OpenAI

from agents.base_agent import BaseAgent
from agents.fmea_agent import FMEAAgent
from agents.hr_agent import HRAgent
from agents.finance_agent import FinanceAgent
from agents.production_agent import ProductionAgent
from agents.sales_agent import SalesAgent


def load_prompt(prompt_file: str, base_dir: str = None) -> str:
    """Baca system prompt dari file."""
    if base_dir:
        path = os.path.join(base_dir, prompt_file)
    else:
        path = prompt_file
    with open(path, encoding="utf-8") as f:
        return f.read()


def build_agent(name: str, agent_config: dict, deepseek_client: OpenAI,
                project_id: str, location: str, base_dir: str) -> BaseAgent:
    """
    Bangun instance sub-agent berdasarkan config.
    data_store_ids di sini belum difilter RBAC — filtering terjadi di supervisor
    saat instantiate (lewat filter_data_stores).
    """
    prompt = load_prompt(agent_config["system_prompt_file"], base_dir)

    common_kwargs = dict(
        name=name,
        domain=agent_config["domain"],
        description=agent_config["description"],
        data_store_ids=agent_config["data_store_ids"],
        system_prompt=prompt,
        deepseek_client=deepseek_client,
        project_id=project_id,
        location=location,
        temperature=agent_config.get("temperature", 0.0),
        max_context_chunks=agent_config.get("max_context_chunks", 3),
    )

    # Dispatch ke subclass spesifik (untuk custom logic per domain)
    agent_classes = {
        "fmea_agent": FMEAAgent,
        "hr_agent": HRAgent,
        "finance_agent": FinanceAgent,
        "production_agent": ProductionAgent,
        "sales_agent": SalesAgent,
    }

    cls = agent_classes.get(name, BaseAgent)
    return cls(**common_kwargs)


def build_all_agents(registry_path: str, deepseek_client: OpenAI,
                     project_id: str, location: str = "global",
                     base_dir: str = None) -> dict:
    """
    Bangun semua sub-agent dari registry YAML.
    Return dict {agent_name: BaseAgent instance}.
    """
    if base_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    with open(registry_path, encoding="utf-8") as f:
        registry = yaml.safe_load(f)["agents"]

    agents = {}
    for name, config in registry.items():
        try:
            agents[name] = build_agent(name, config, deepseek_client, project_id, location, base_dir)
            print(f"✅ Agent '{name}' loaded (domain: {config['domain']})")
        except FileNotFoundError as e:
            print(f"⚠️ Agent '{name}' dilewati - prompt file tidak ditemukan: {e}")
        except Exception as e:
            print(f"⚠️ Agent '{name}' gagal dimuat: {e}")
    return agents
