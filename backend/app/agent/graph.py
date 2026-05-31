from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import (
    guardrail_node,
    extraction_node,
    tool_node,
    policy_evaluation_node,
    response_generation_node
)

def build_graph():
    builder = StateGraph(AgentState)
    
    # Add nodes
    builder.add_node("guardrail", guardrail_node)
    builder.add_node("extraction", extraction_node)
    builder.add_node("tool", tool_node)
    builder.add_node("policy", policy_evaluation_node)
    builder.add_node("response", response_generation_node)
    
    # Define edges
    builder.set_entry_point("guardrail")
    
    # Guardrail routing
    def guardrail_router(state: AgentState) -> str:
        if state.get("final_action") == "deny":
            return "response"
        return "extraction"
        
    builder.add_conditional_edges("guardrail", guardrail_router)
    
    # Extraction straight to tool
    builder.add_edge("extraction", "tool")
    
    # Tool straight to policy
    builder.add_edge("tool", "policy")
    
    # Policy to response
    builder.add_edge("policy", "response")
    
    # End
    builder.add_edge("response", END)
    
    return builder.compile()

graph = build_graph()
