import os
from typing import TypedDict, Any
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# Load .env variables (e.g., API keys) at startup
load_dotenv()

# Import our three data-processing orchestrators
from agents.structured import run_structured_data_logic
from agents.text import run_text_data_logic
from agents.visual import run_visual_data_logic

# Define the shared state schema for our graph nodes
class DataTeamState(TypedDict, total=False):
    file_path: str           # Path to the input file
    processed_data: Any      # Result of processing (dict or DataFrame)
    summary_report: str      # Human-readable summary

# Node: structured data processing (CSV, etc.)
def structured_data_node(state: DataTeamState) -> DataTeamState:
    file_path = state["file_path"]
    # Run our structured-data pipeline: profile, plan, apply, summarize
    processed, report, _ = run_structured_data_logic(file_path)
    return {
        "processed_data": processed,
        "summary_report": report
    }

# Node: text data processing (PDF, TXT, MD)
def text_data_node(state: DataTeamState) -> DataTeamState:
    file_path = state["file_path"]
    # Run our text pipeline: profile, plan, clean, summarize
    processed, report, _ = run_text_data_logic(file_path)
    return {
        "processed_data": processed,
        "summary_report": report
    }

# Node: visual/image data processing (JPG, PNG, etc.)
def visual_data_node(state: DataTeamState) -> DataTeamState:
    file_path = state["file_path"]
    # Run our visual pipeline: profile, plan, explain, apply
    processed, report = run_visual_data_logic(file_path)
    return {
        "processed_data": processed,
        "summary_report": report
    }

# Router function: pick node based on file extension
def file_type_router(state: DataTeamState) -> str:
    path = state["file_path"].lower()
    if path.endswith(".csv"):
        return "structured"
    if path.endswith((".pdf", ".txt", ".md")):
        return "text"
    if path.endswith((".jpg", ".jpeg", ".png")):
        return "visual"
    # Default to text for unknown extensions
    return "text"

# Build the state graph
workflow = StateGraph(DataTeamState)

# Register our processing nodes
workflow.add_node("structured", structured_data_node)
workflow.add_node("text", text_data_node)
workflow.add_node("visual", visual_data_node)

# From start, route to the right node based on file type
workflow.add_conditional_edges(
    "__start__",
    file_type_router,
    {
        "structured": "structured",
        "text": "text",
        "visual": "visual"
    },
)

# After each specialized node, end the workflow
workflow.add_edge("structured", END)
workflow.add_edge("text", END)
workflow.add_edge("visual", END)

# Compile the graph into an executable app
graph_app = workflow.compile()

print(" Data Preprocessing Graph Compiled Successfully!")
