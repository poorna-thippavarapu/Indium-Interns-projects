import os
from typing import TypedDict, Any
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()

from agents.structured import run_structured_data_logic
from agents.text import run_text_data_logic
from agents.visual import run_visual_data_logic

class DataTeamState(TypedDict, total=False):
    file_path: str
    processed_data: Any
    summary_report: str

def structured_data_node(state: DataTeamState) -> DataTeamState:
    file_path = state["file_path"]
    processed, report, _ = run_structured_data_logic(file_path)
    return {"processed_data": processed, "summary_report": report}

def text_data_node(state: DataTeamState) -> DataTeamState:
    file_path = state["file_path"]
    processed, report, _ = run_text_data_logic(file_path)
    return {"processed_data": processed, "summary_report": report}

def visual_data_node(state: DataTeamState) -> DataTeamState:
    file_path = state["file_path"]
    processed, report = run_visual_data_logic(file_path)
    return {"processed_data": processed, "summary_report": report}

def file_type_router(state: DataTeamState) -> str:
    path = state["file_path"].lower()
    if path.endswith(".csv"): return "structured"
    if path.endswith((".pdf", ".txt", ".md")): return "text"
    if path.endswith((".jpg", ".jpeg", ".png")): return "visual"
    return "text"

workflow = StateGraph(DataTeamState)

workflow.add_node("structured", structured_data_node)
workflow.add_node("text", text_data_node)
workflow.add_node("visual", visual_data_node)

workflow.add_conditional_edges(
    "__start__",
    file_type_router,
    {"structured": "structured", "text": "text", "visual": "visual"},
)

workflow.add_edge("structured", END)
workflow.add_edge("text", END)
workflow.add_edge("visual", END)

graph_app = workflow.compile()
print("✅ Data Preprocessing Graph Compiled Successfully!")