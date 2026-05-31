from fastapi import FastAPI, BackgroundTasks, Request, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .schemas import (
    ChatRequest,
    UserCreate,
    UserUpdate,
    UserResponse,
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    ItemCreate,
    ItemUpdate,
    ItemResponse
)
from .database import get_db
from .models import User, Order, Item
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

# ----------------- Chat Endpoint -----------------

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Fetch Customer Info if user_id is provided
        customer_info = None
        if request.user_id:
            user = db.query(User).filter(User.id == request.user_id).first()
            if user:
                customer_info = {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "risk_score": user.risk_score,
                    "orders": [
                        {
                            "id": o.id,
                            "purchase_date": o.purchase_date.isoformat() if o.purchase_date else None,
                            "total_amount": o.total_amount,
                            "status": o.status
                        } for o in user.orders
                    ]
                }
        
        cust_name = customer_info["name"] if customer_info else "Anonymous"
        await observer.emit(request.session_id, f"SYSTEM: Starting agent workflow for customer '{cust_name}'...")
        
        initial_state = {
            "session_id": request.session_id,
            "messages": [HumanMessage(content=request.message)],
            "order_id": None,
            "extracted_name": None,
            "extracted_email": None,
            "policy_check_result": None,
            "agent_thoughts": [],
            "final_action": None,
            "response": None,
            "customer_info": None # Agent starts with no pre-loaded knowledge, must query tools dynamically
        }
        
        # Execute LangGraph state machine
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


# =====================================================================
# ======================== CRM CRUD API ROUTES ========================
# =====================================================================

# ----------------- Users CRUD -----------------

@app.get("/api/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check email duplicate
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_user = User(
        name=user.name,
        email=user.email,
        risk_score=user.risk_score
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Delete cascade orders & items
    for order in db_user.orders:
        db.query(Item).filter(Item.order_id == order.id).delete()
    db.query(Order).filter(Order.user_id == user_id).delete()
    
    db.delete(db_user)
    db.commit()
    return {"message": f"User {user_id} and all related orders deleted successfully."}


# ----------------- Orders CRUD -----------------

@app.get("/api/orders", response_model=List[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@app.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.post("/api/orders", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_order = Order(
        user_id=order.user_id,
        purchase_date=order.purchase_date or datetime.utcnow(),
        total_amount=order.total_amount,
        status=order.status
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/api/orders/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    update_data = order_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)
        
    db.commit()
    db.refresh(db_order)
    return db_order

@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Delete cascade items
    db.query(Item).filter(Item.order_id == order_id).delete()
    
    db.delete(db_order)
    db.commit()
    return {"message": f"Order {order_id} and related items deleted successfully."}


# ----------------- Items CRUD -----------------

@app.get("/api/items", response_model=List[ItemResponse])
def get_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

@app.post("/api/items", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    # Check if order exists
    order = db.query(Order).filter(Order.id == item.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db_item = Item(
        order_id=item.order_id,
        product_name=item.product_name,
        price=item.price,
        is_final_sale=item.is_final_sale,
        return_window_days=item.return_window_days
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/api/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_update: ItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(db_item)
    db.commit()
    return {"message": f"Item {item_id} deleted successfully."}


# ----------------- Health -----------------

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
