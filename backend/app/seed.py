from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
from .database import engine, Base, SessionLocal
from .models import User, Order, Item

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_db():
    logger.info("Initializing database schema...")
    
    # Drop all tables and recreate them to guarantee fresh, complete seed data in our demo container!
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    logger.info("Seeding mock CRM data...")

    # Create Users
    u1 = User(name="Alice Smith", email="alice@example.com", risk_score="low")
    u2 = User(name="Bob Jones", email="bob@example.com", risk_score="high")
    u3 = User(name="Charlie Brown", email="charlie@example.com", risk_score="medium")
    u4 = User(name="David Miller", email="david@example.com", risk_score="low")
    u5 = User(name="Emma Wilson", email="emma@example.com", risk_score="low")
    db.add_all([u1, u2, u3, u4, u5])
    db.commit()

    # Create Orders
    now = datetime.utcnow()
    
    # Alice's orders (Low Risk)
    # Order 1: Recent, normal items
    o1 = Order(user_id=u1.id, purchase_date=now - timedelta(days=5), total_amount=150.0, status="delivered")
    # Order 4: High value (> $500)
    o4 = Order(user_id=u1.id, purchase_date=now - timedelta(days=2), total_amount=600.0, status="delivered")
    
    # Bob's order (High Risk)
    # Order 2: Final sale item
    o2 = Order(user_id=u2.id, purchase_date=now - timedelta(days=10), total_amount=80.0, status="delivered")
    
    # Charlie's order (Medium Risk)
    # Order 3: Past return window
    o3 = Order(user_id=u3.id, purchase_date=now - timedelta(days=40), total_amount=120.0, status="delivered")
    
    # David's orders (Low Risk)
    # Order 5: Cheap item, refundable
    o5 = Order(user_id=u4.id, purchase_date=now - timedelta(days=3), total_amount=45.0, status="delivered")
    # Order 6: Multiple items
    o6 = Order(user_id=u4.id, purchase_date=now - timedelta(days=15), total_amount=210.0, status="delivered")
    
    # Emma's orders (Low Risk)
    # Order 7: Medium value, processing status (cannot return yet)
    o7 = Order(user_id=u5.id, purchase_date=now - timedelta(days=1), total_amount=480.0, status="processing")
    # Order 8: Past return window (14 days for smartphone items)
    o8 = Order(user_id=u5.id, purchase_date=now - timedelta(days=20), total_amount=15.0, status="delivered")
    
    db.add_all([o1, o2, o3, o4, o5, o6, o7, o8])
    db.commit()

    # Create Items
    
    # Items for Order 1 (Refundable)
    i1_1 = Item(order_id=o1.id, product_name="Wireless Mouse", price=50.0, is_final_sale=False, return_window_days=30)
    i1_2 = Item(order_id=o1.id, product_name="Mechanical Keyboard", price=100.0, is_final_sale=False, return_window_days=30)
    
    # Items for Order 2 (Final Sale Clearance)
    i2_1 = Item(order_id=o2.id, product_name="Clearance T-Shirt", price=30.0, is_final_sale=True, return_window_days=30)
    i2_2 = Item(order_id=o2.id, product_name="Premium Wool Socks", price=50.0, is_final_sale=False, return_window_days=30)

    # Items for Order 3 (Past Return Window)
    i3_1 = Item(order_id=o3.id, product_name="Desk Lamp", price=120.0, is_final_sale=False, return_window_days=30)

    # Items for Order 4 (High Value > $500)
    i4_1 = Item(order_id=o4.id, product_name="Smartphone", price=600.0, is_final_sale=False, return_window_days=14)

    # Items for Order 5 (David's Refundable Mousepad)
    i5_1 = Item(order_id=o5.id, product_name="Custom Gaming Mouse Pad", price=45.0, is_final_sale=False, return_window_days=30)

    # Items for Order 6 (David's Keyboard & Mouse)
    i6_1 = Item(order_id=o6.id, product_name="Ergonomic Mouse", price=60.0, is_final_sale=False, return_window_days=30)
    i6_2 = Item(order_id=o6.id, product_name="USB-C Charging Hub", price=150.0, is_final_sale=False, return_window_days=30)

    # Items for Order 7 (Emma's Headset - Processing Status)
    i7_1 = Item(order_id=o7.id, product_name="Active Noise-Cancelling Headphones", price=480.0, is_final_sale=False, return_window_days=30)

    # Items for Order 8 (Emma's Charger - Past return window)
    i8_1 = Item(order_id=o8.id, product_name="Fast Wall Charger Block", price=15.0, is_final_sale=False, return_window_days=14)

    db.add_all([i1_1, i1_2, i2_1, i2_2, i3_1, i4_1, i5_1, i6_1, i6_2, i7_1, i8_1])
    db.commit()
    db.close()
    
    logger.info("Database seeded successfully.")

if __name__ == "__main__":
    seed_db()
