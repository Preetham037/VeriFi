import os
import sys
import datetime
import random
import numpy as np

# Adjust python path if needed to import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, init_db, TransactionPrediction
from backend.model_utils import predict_transaction

def seed_database():
    print("Initializing database tables...")
    init_db()
    
    db = SessionLocal()
    
    # Check if database already has transactions
    count = db.query(TransactionPrediction).count()
    if count > 50:
        print(f"Database already has {count} transactions. Re-seeding...")
        db.query(TransactionPrediction).delete()
        db.commit()
        
    print("Seeding database with historical transactions...")
    random.seed(42)
    np.random.seed(42)
    
    now = datetime.datetime.utcnow()
    
    # Generate 120 transactions spread across the last 7 days
    total_inserted = 0
    
    # Feature categories
    online_p = 0.55
    international_p = 0.06
    
    for day_offset in range(7, -1, -1): # 7 days ago to today
        # Number of transactions on this day (increased to match simulator volume)
        daily_count = random.randint(250, 400)
        
        for _ in range(daily_count):
            # Hour of transaction
            hour = random.randint(0, 23)
            
            # Timestamp calculation
            txn_time = now - datetime.timedelta(days=day_offset, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            # Features
            is_online = 1 if random.random() < online_p else 0
            is_international = 1 if random.random() < international_p else 0
            card_present = 0 if is_online == 1 else (1 if random.random() < 0.9 else 0)
            
            # Generate amount
            if random.random() < 0.05:
                # Occasional high transaction amount
                amt = float(np.random.exponential(scale=600) + 100)
            else:
                amt = float(np.random.exponential(scale=45) + 5)
            amt = round(clip_value(amt, 2, 5000), 2)
            
            # Distance
            if is_international:
                distance = float(random.uniform(500, 4500))
            else:
                distance = float(np.random.exponential(scale=12) + 0.1)
            distance = round(clip_value(distance, 0.1, 5000), 2)
            
            # Velocity (number of transactions in last 24h)
            txn_velocity = int(np.random.poisson(lam=2.2) + 1)
            
            # Cardholder age
            age = int(np.clip(np.random.normal(loc=46, scale=14), 18, 90))
            
            # Synthesize occasional high-risk fraud cases intentionally to match rules
            # (Rule 1: High amount online)
            if random.random() < 0.04:
                amt = round(random.uniform(900, 2500), 2)
                is_online = 1
                card_present = 0
            # (Rule 2: International + high distance)
            elif random.random() < 0.03:
                is_international = 1
                distance = round(random.uniform(1200, 3500), 2)
            # (Rule 3: Late night high velocity)
            elif random.random() < 0.03:
                hour = random.choice([1, 2, 3, 4])
                txn_velocity = random.randint(8, 12)
                is_online = 1
                card_present = 0
                
            features = {
                "amt": amt,
                "distance": distance,
                "txn_velocity": txn_velocity,
                "age": age,
                "hour": hour,
                "is_online": is_online,
                "is_international": is_international,
                "card_present": card_present
            }
            
            # Get model prediction
            pred = predict_transaction(features)
            
            db_record = TransactionPrediction(
                timestamp=txn_time,
                amt=amt,
                distance=distance,
                txn_velocity=txn_velocity,
                age=age,
                hour=hour,
                is_online=bool(is_online),
                is_international=bool(is_international),
                card_present=bool(card_present),
                risk_score=pred["risk_score"],
                is_fraud=pred["is_fraud"],
                severity=pred["severity"],
                explanation_json=pred["explanation"]
            )
            db.add(db_record)
            total_inserted += 1
            
    db.commit()
    db.close()
    print(f"Successfully seeded database with {total_inserted} transactions.")

def clip_value(val, min_val, max_val):
    return max(min(val, max_val), min_val)

if __name__ == "__main__":
    seed_database()
