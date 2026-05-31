from typing import TypedDict, Annotated, List, Optional, Dict, Any
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    session_id: str
    messages: Annotated[List[BaseMessage], operator.add]
    order_id: Optional[str]
    extracted_name: Optional[str]
    extracted_email: Optional[str]
    policy_check_result: Optional[str]
    agent_thoughts: Annotated[List[str], operator.add]
    final_action: Optional[str] # "refund", "deny", "escalate", "ask_order_id"
    response: Optional[str]
    customer_info: Optional[Dict[str, Any]]
