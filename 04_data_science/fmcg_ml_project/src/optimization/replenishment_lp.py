"""
Goes one step beyond the SQL rule-based `mart_replenishment_recommendation`
(which recommends an order qty per SKU independently, with no budget or
warehouse-capacity constraint) by solving a company-wide Integer Program:

    minimize   sum( shortage_penalty * unmet_need )  -  sum( value_weight * order_qty )
    subject to sum( order_qty * unit_cost ) <= budget
               sum( order_qty * pack_volume ) <= warehouse_capacity   (optional)
               order_qty is a multiple of Pack_Size, order_qty <= 0 if no reorder needed
               order_qty >= MOQ if the SKU is ordered at all (semi-continuous, modeled
               with a binary "is_ordered" indicator)

In plain terms: when there ISN'T enough budget to fully replenish every SKU
that the rule-based system flagged, which SKUs should get priority? This
prioritizes by (a) how far under the reorder point the SKU is, weighted by
its ABC class / value, and (b) MOQ efficiency.

Run:
    python -m src.optimization.replenishment_lp --budget 200000000
"""
import argparse
import os
import sys

import pandas as pd
import pulp

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import config
from src.data.loader import get_inventory_health


ABC_WEIGHT = {"A": 3.0, "B": 2.0, "C": 1.0}


def prepare_candidates(inv_health: pd.DataFrame) -> pd.DataFrame:
    df = inv_health.copy()
    rename = {
        "Current_Stock": "current_stock", "MOQ": "moq", "Pack_Size": "pack_size",
        "Unit_Cost": "unit_cost", "abc_class_recomputed": "abc_class", "ABC_Class": "abc_class",
    }
    df = df.rename(columns={k: v for k, v in rename.items() if k in df.columns})
    needed = df[df["replenishment_status"].isin(["STOCKOUT", "REORDER_NOW"])].copy()
    needed["gap_units"] = (needed["max_level"] - needed["projected_stock"]).clip(lower=needed["moq"])
    needed["gap_units"] = (needed["gap_units"] / needed["pack_size"]).apply(lambda x: max(int(x), 1)) * needed["pack_size"]
    needed["priority_weight"] = needed["abc_class"].map(ABC_WEIGHT).fillna(1.0)
    return needed.reset_index(drop=True)


def solve(candidates: pd.DataFrame, budget: float, capacity_units: float = None) -> pd.DataFrame:
    prob = pulp.LpProblem("replenishment_optimization", pulp.LpMaximize)

    n_packs = {}   # number of packs to order, per row
    is_ordered = {}
    for i, row in candidates.iterrows():
        max_packs = int(row.gap_units / row.pack_size) + 2  # small headroom above the rule-based gap
        n_packs[i] = pulp.LpVariable(f"packs_{i}", lowBound=0, upBound=max_packs, cat="Integer")
        is_ordered[i] = pulp.LpVariable(f"ordered_{i}", cat="Binary")

    # objective: maximize priority-weighted units ordered (proxy for risk reduction),
    # scaled so ABC-A shortages are satisfied before ABC-C
    prob += pulp.lpSum(
        candidates.loc[i, "priority_weight"] * n_packs[i] * candidates.loc[i, "pack_size"]
        for i in candidates.index
    )

    # budget constraint
    prob += pulp.lpSum(
        n_packs[i] * candidates.loc[i, "pack_size"] * candidates.loc[i, "unit_cost"]
        for i in candidates.index
    ) <= budget

    # optional warehouse capacity constraint (in units)
    if capacity_units is not None:
        prob += pulp.lpSum(
            n_packs[i] * candidates.loc[i, "pack_size"] for i in candidates.index
        ) <= capacity_units

    # MOQ logic: if ordered at all, must order at least MOQ worth of packs
    for i, row in candidates.iterrows():
        moq_packs = max(int(row.moq / row.pack_size), 1)
        max_packs = int(row.gap_units / row.pack_size) + 2
        prob += n_packs[i] <= max_packs * is_ordered[i]
        prob += n_packs[i] >= moq_packs * is_ordered[i]

    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    candidates = candidates.copy()
    candidates["optimized_order_units"] = [int(pulp.value(n_packs[i]) or 0) * candidates.loc[i, "pack_size"] for i in candidates.index]
    candidates["optimized_order_cost"] = candidates["optimized_order_units"] * candidates["unit_cost"]
    candidates["fully_funded"] = candidates["optimized_order_units"] >= candidates["gap_units"]
    candidates["status"] = pulp.LpStatus[prob.status]
    return candidates


def run(budget: float, capacity_units: float = None):
    inv_health = get_inventory_health()
    candidates = prepare_candidates(inv_health)
    print(f"{len(candidates)} SKU x Warehouse rows flagged REORDER_NOW/STOCKOUT by the rule-based mart.")

    unconstrained_cost = (candidates["gap_units"] * candidates["unit_cost"]).sum()
    print(f"Cost to fully satisfy ALL of them (unconstrained rule-based recommendation): {unconstrained_cost:,.0f} IDR")
    print(f"Budget given to the optimizer: {budget:,.0f} IDR")

    result = solve(candidates, budget=budget, capacity_units=capacity_units)

    key_cols = [c for c in ["SKU_ID", "sku", "Warehouse_ID", "warehouse", "abc_class"] if c in result.columns]
    out_cols = key_cols + ["gap_units", "optimized_order_units", "optimized_order_cost", "fully_funded", "priority_weight"]
    out = result[out_cols].sort_values(["fully_funded", "priority_weight"], ascending=[False, False])

    print(f"\nSolver status: {result['status'].iloc[0]}")
    print(f"Total spend: {result['optimized_order_cost'].sum():,.0f} IDR")
    print(f"SKUs fully funded: {result['fully_funded'].sum()} / {len(result)}")
    print(f"By ABC class, fully-funded rate:")
    print(result.groupby("abc_class")["fully_funded"].mean().round(2))

    out_path = os.path.join(config.OUTPUT_DIR, "optimized_replenishment_plan.csv")
    out.to_csv(out_path, index=False)
    print(f"\nSaved -> {out_path}")
    return out


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--budget", type=float, default=200_000_000, help="Total procurement budget in IDR")
    parser.add_argument("--capacity-units", type=float, default=None, help="Optional total warehouse capacity in units")
    args = parser.parse_args()
    run(budget=args.budget, capacity_units=args.capacity_units)
