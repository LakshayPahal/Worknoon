from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import User, Order, Item
import json

def get_order_details(order_id: int) -> str:
    """Strict, read-only tool to fetch order, item, and associated customer details by Order ID."""
    db: Session = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return json.dumps({"error": f"Order {order_id} not found."})

        # Fetch associated customer
        customer = db.query(User).filter(User.id == order.user_id).first()
        customer_info = None
        if customer:
            customer_info = {
                "id": customer.id,
                "name": customer.name,
                "email": customer.email,
                "risk_score": customer.risk_score
            }

        items = db.query(Item).filter(Item.order_id == order_id).all()
        
        result = {
            "order_id": order.id,
            "user_id": order.user_id,
            "purchase_date": order.purchase_date.isoformat() if order.purchase_date else None,
            "total_amount": order.total_amount,
            "status": order.status,
            "customer": customer_info,
            "items": [
                {
                    "product_name": item.product_name,
                    "price": item.price,
                    "is_final_sale": item.is_final_sale,
                    "return_window_days": item.return_window_days
                } for item in items
            ]
        }
        return json.dumps(result, indent=2)
    finally:
        db.close()

def find_customer_by_name(name: str) -> str:
    """Strict, read-only tool to search for a customer and their orders by their full name."""
    db: Session = SessionLocal()
    try:
        # Search by name case-insensitive
        user = db.query(User).filter(User.name.ilike(f"%{name.strip()}%")).first()
        if not user:
            return json.dumps({"error": f"Customer with name matching '{name}' not found."})

        result = {
            "customer": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "risk_score": user.risk_score
            },
            "orders": [
                {
                    "id": o.id,
                    "purchase_date": o.purchase_date.isoformat() if o.purchase_date else None,
                    "total_amount": o.total_amount,
                    "status": o.status
                } for o in user.orders
            ]
        }
        return json.dumps(result, indent=2)
    finally:
        db.close()

def find_customer_by_email(email: str) -> str:
    """Strict, read-only tool to search for a customer and their orders by their email address."""
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email.ilike(email.strip())).first()
        if not user:
            return json.dumps({"error": f"Customer with email '{email}' not found."})

        result = {
            "customer": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "risk_score": user.risk_score
            },
            "orders": [
                {
                    "id": o.id,
                    "purchase_date": o.purchase_date.isoformat() if o.purchase_date else None,
                    "total_amount": o.total_amount,
                    "status": o.status
                } for o in user.orders
            ]
        }
        return json.dumps(result, indent=2)
    finally:
        db.close()
