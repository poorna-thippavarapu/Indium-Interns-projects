import pandas as pd
import numpy as np
import os
import json

def run_structured_data_logic(file_path):
    """
    Reads a CSV, profiles, plans, and cleans the data, and returns the cleaned DataFrame, a human-readable summary, and the final profile.
    """
    def get_data_profile(df: pd.DataFrame) -> str:
        desc_json = df.describe(include='all').to_json(orient='columns')
        if desc_json is None:
            desc_json = '{}'
        profile = {
            "dataset_shape": df.shape,
            "column_names": df.columns.tolist(),
            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing_values_percent": {col: f"{df[col].isnull().sum() / len(df) * 100:.2f}%" for col in df.columns if df[col].isnull().sum() > 0},
            "descriptive_stats": json.loads(desc_json)
        }
        return json.dumps(profile, indent=2)

    def execute_cleaning_step(df: pd.DataFrame, step_json: str) -> pd.DataFrame:
        step = json.loads(step_json)
        df_copy = df.copy()
        action = step.get('action')
        column = step.get('column')
        if action == 'drop_column':
            df_copy.drop(columns=[column], inplace=True)
        elif action == 'impute':
            value = step.get('value')
            if pd.api.types.is_numeric_dtype(df_copy[column]):
                if value == 'mean': fill_value = float(df_copy[column].mean())
                elif value == 'median': fill_value = float(df_copy[column].median())
                else: fill_value = float(df_copy[column].mode().iloc[0])
            else:
                fill_value = df_copy[column].mode().iloc[0]
            df_copy[column] = df_copy[column].fillna(fill_value)
        return df_copy

    def create_cleaning_plan(data_profile: str) -> str:
        # This is a placeholder for LLM logic. For now, just drop columns with >50% nulls and impute others.
        profile = json.loads(data_profile)
        steps = []
        for col, pct in profile["missing_values_percent"].items():
            pct_val = float(pct.strip('%'))
            dtype = profile["data_types"][col]
            if pct_val > 50:
                steps.append({"column": col, "action": "drop_column"})
            elif "float" in dtype or "int" in dtype:
                steps.append({"column": col, "action": "impute", "value": "mean"})
            else:
                steps.append({"column": col, "action": "impute", "value": "mode"})
        return json.dumps({"steps": steps})

    # Step 1: Load and profile the data
    df = pd.read_csv(file_path)
    initial_profile = get_data_profile(df)

    # Step 2: Create a cleaning plan
    cleaning_plan_json = create_cleaning_plan(initial_profile)
    plan_data = json.loads(cleaning_plan_json)

    # Step 3: Execute the plan
    current_df = df.copy()
    for step in plan_data.get("steps", []):
        step_str = json.dumps(step)
        current_df = execute_cleaning_step(current_df, step_str)

    # Step 4: Profile the cleaned data (optional, for reporting)
    final_profile = get_data_profile(current_df)
    print("Final Cleaned Data Profile:")
    print(final_profile)

    # Create a human-readable summary of actions taken
    plan_steps = plan_data.get("steps", [])
    if not plan_steps:
        summary = "No cleaning needed. The dataset is clean."
    else:
        actions_taken = [f"- {s['action'].replace('_', ' ')} on column '{s['column']}'" for s in plan_steps]
        summary = "Data cleaning complete. Actions taken:\n" + "\n".join(actions_taken)

    return current_df, summary, final_profile
