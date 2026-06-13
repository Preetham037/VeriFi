from sqlalchemy import create_engine, Column, Integer, Float, Boolean, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

import os

# Use the environment variable if available (for production), otherwise fallback to local postgres
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://preetham@localhost/fraud_detection")

# Cloud providers like Render sometimes provide URLs starting with postgres:// which SQLAlchemy 1.4+ does not support natively
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TransactionPrediction(Base):
    __tablename__ = "transaction_predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Input features
    amt = Column(Float, nullable=False)
    distance = Column(Float, nullable=False)
    txn_velocity = Column(Integer, nullable=False)
    age = Column(Integer, nullable=False)
    hour = Column(Integer, nullable=False)
    is_online = Column(Boolean, nullable=False)
    is_international = Column(Boolean, nullable=False)
    card_present = Column(Boolean, nullable=False)
    
    # Prediction details
    risk_score = Column(Float, nullable=False) # 0.0 to 1.0 probability
    is_fraud = Column(Boolean, nullable=False)
    severity = Column(String(50), nullable=False) # Low, Medium, High, Critical
    status = Column(String(50), default="completed") # pending, completed
    
    # SHAP and AI explanations
    explanation_json = Column(Text, nullable=True) # JSON holding SHAP values & AI explanation text

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
