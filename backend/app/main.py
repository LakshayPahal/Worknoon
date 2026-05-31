from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from .schemas import ChatRequest
from .agent.graph import graph
from .agent.observer import observer
from langchain_core.messages import HumanMessage
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Worknoon AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def run_agent(session_id: str, message: str):
    """Run the LangGraph workflow in the background."""
    try:
        await observer.emit(session_id, "SYSTEM: Starting agent workflow...")
        initial_state = {
            "session_id": session_id,
            "messages": [HumanMessage(content=message)],
            "order_id": None,
            "policy_check_result": None,
            "agent_thoughts": [],
            "final_action": None,
            "response": None
        }
        
        # We must use ainvoke for async LangGraph nodes
        final_state = await graph.ainvoke(initial_state)
        
        await observer.emit(session_id, "SYSTEM: Workflow complete.")
    except Exception as e:
        await observer.emit(session_id, f"SYSTEM ERROR: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    # Initiate the graph execution and wait for the result
    try:
        await observer.emit(request.session_id, "SYSTEM: Starting agent workflow...")
        initial_state = {
            "session_id": request.session_id,
            "messages": [HumanMessage(content=request.message)],
            "order_id": None,
            "policy_check_result": None,
            "agent_thoughts": [],
            "final_action": None,
            "response": None
        }
        
        final_state = await graph.ainvoke(initial_state)
        
        await observer.emit(request.session_id, "SYSTEM: Workflow complete.")
        
        return {
            "status": "success", 
            "session_id": request.session_id,
            "final_response": final_state.get("response", "No response generated.")
        }
    except Exception as e:
        await observer.emit(request.session_id, f"SYSTEM ERROR: {str(e)}")
        return {"status": "error", "error": str(e)}

@app.get("/api/logs/{session_id}")
async def logs_endpoint(session_id: str, request: Request):
    """Server-Sent Events endpoint to stream logs to the admin dashboard."""
    return StreamingResponse(
        observer.stream_logs(session_id), 
        media_type="text/event-stream"
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
