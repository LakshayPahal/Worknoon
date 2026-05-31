from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    session_id: str
    messages: Annotated[List[BaseMessage], operator.add]
    order_id: Optional[str]
    policy_check_result: Optional[str]
    agent_thoughts: Annotated[List[str], operator.add]
    final_action: Optional[str] # "refund", "deny", "escalate"
    response: Optional[str]
