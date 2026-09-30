"""RBAC Middleware: cek permission user berdasarkan Discord ID/role."""
from __future__ import annotations

import os
from typing import Optional

import yaml

from auth.role_store import RoleStore


class RBACMiddleware:
    """Middleware untuk cek akses user ke agent/data_store/tools."""

    def __init__(self, role_store: RoleStore, registry_path: str, matrix_path: str):
        self.role_store = role_store
        with open(registry_path, encoding="utf-8") as f:
            self.registry = yaml.safe_load(f)["agents"]
        with open(matrix_path, encoding="utf-8") as f:
            self.matrix = yaml.safe_load(f)["roles"]

    def get_user_role(self, discord_user_id: str, guild_roles: Optional[list] = None) -> str:
        """
        Tentukan role bisnis user.
        Prioritas:
          1. Mapping eksplisit di Firestore (paling aman)
          2. Discord guild role name (fallback)
          3. 'guest' (default deny)
        """
        # Opsi 1: Mapping eksplisit di Firestore
        role = self.role_store.get_role(discord_user_id)
        if role:
            return role

        # Opsi 2: Fallback ke Discord guild role name
        if guild_roles:
            for grole in guild_roles:
                role_name = getattr(grole, "name", str(grole)).lower().replace(" ", "_")
                if role_name in self.matrix:
                    return role_name

        return "guest"

    def get_permissions(self, role: str) -> dict:
        """Ambil permission config untuk role tertentu."""
        return self.matrix.get(role, self.matrix.get("guest", {
            "allowed_agents": [],
            "allowed_data_stores": [],
            "max_turns_per_day": 0,
            "can_use_tools": [],
        }))

    def check_agent_access(self, role: str, agent_name: str) -> dict:
        """Cek apakah role boleh akses agent tertentu."""
        perms = self.get_permissions(role)
        allowed_agents = perms.get("allowed_agents", [])

        if agent_name not in allowed_agents and "*" not in allowed_agents:
            return {
                "allowed": False,
                "reason": f"Role '{role}' tidak diizinkan akses agent '{agent_name}'",
                "role": role,
            }

        return {
            "allowed": True,
            "role": role,
            "data_stores": perms.get("allowed_data_stores", []),
            "tools": perms.get("can_use_tools", []),
            "max_turns_per_day": perms.get("max_turns_per_day", 0),
        }

    def filter_data_stores(self, agent_data_stores: list, role_data_stores: list) -> list:
        """
        Irisan data store yang boleh diakses agent vs yang boleh diakses role.
        Mencegah technician akses data finance walau agent-nya sama.
        """
        if "*" in role_data_stores:
            return agent_data_stores
        return [ds for ds in agent_data_stores if ds in role_data_stores]

    def check_tool_access(self, role: str, tool_name: str) -> bool:
        """Cek apakah role boleh pakai tool tertentu."""
        perms = self.get_permissions(role)
        allowed_tools = perms.get("can_use_tools", [])
        return tool_name in allowed_tools or "*" in allowed_tools
