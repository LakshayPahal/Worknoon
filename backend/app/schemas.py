from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: Optional[int] = None

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    risk_score: str  # 'low', 'medium', 'high'

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    risk_score: Optional[str] = None

# Item Schemas
class ItemBase(BaseModel):
    product_name: str
    price: float
    is_final_sale: bool = False
    return_window_days: int = 30

class ItemCreate(ItemBase):
    order_id: int

class ItemUpdate(BaseModel):
    product_name: Optional[str] = None
    price: Optional[float] = None
    is_final_sale: Optional[bool] = None
    return_window_days: Optional[int] = None

class ItemResponse(ItemBase):
    id: int
    order_id: int
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    user_id: int
    purchase_date: Optional[datetime] = None
    total_amount: float
    status: str  # 'delivered', 'processing', 'returned'

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    purchase_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    items: List[ItemResponse] = []
    class Config:
        from_attributes = True

# User Response Schema (with nested orders)
class UserResponse(UserBase):
    id: int
    orders: List[OrderResponse] = []
    class Config:
        from_attributes = True

