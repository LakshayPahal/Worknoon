from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Order, Item
import json

def get_order_details(order_id: int) -> str:
    """Strict, read-only SQL tool to fetch order and item details."""
    db: Session = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return json.dumps({"error": f"Order {order_id} not found."})

        items = db.query(Item).filter(Item.order_id == order_id).all()
        
        result = {
            "order_id": order.id,
            "purchase_date": order.purchase_date.isoformat(),
            "total_amount": order.total_amount,
            "status": order.status,
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
