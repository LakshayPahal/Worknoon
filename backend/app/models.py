from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    risk_score = Column(String)  # 'low', 'medium', 'high'

    orders = relationship("Order", back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    purchase_date = Column(DateTime, default=datetime.utcnow)
    total_amount = Column(Float)
    status = Column(String)  # 'delivered', 'processing', 'returned'

    user = relationship("User", back_populates="orders")
    items = relationship("Item", back_populates="order")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_name = Column(String, index=True)
    price = Column(Float)
    is_final_sale = Column(Boolean, default=False)
    return_window_days = Column(Integer, default=30)

    order = relationship("Order", back_populates="items")
