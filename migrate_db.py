import os
from sqlalchemy import text
from backend.database import engine

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE transaction_predictions ADD COLUMN latitude FLOAT;"))
            conn.commit()
            print("Added latitude column.")
        except Exception as e:
            print(f"latitude column might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE transaction_predictions ADD COLUMN longitude FLOAT;"))
            conn.commit()
            print("Added longitude column.")
        except Exception as e:
            print(f"longitude column might already exist: {e}")

if __name__ == "__main__":
    add_columns()
