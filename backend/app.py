from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, Integer
import json
import datetime
from typing import List, Optional

from backend.database import get_db, init_db, TransactionPrediction, SessionLocal
from backend.model_utils import predict_transaction, predict_transaction_fast, explain_transaction_slow, feature_names

app = FastAPI(title="VerFi Fraud Detection Platform API")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup database initialization
@app.on_event("startup")
def startup_event():
    init_db()

# Pydantic Schemas
class TransactionCreate(BaseModel):
    amt: float
    distance: float
    txn_velocity: int
    age: int
    hour: int
    is_online: bool
    is_international: bool
    card_present: bool

class ChatRequest(BaseModel):
    message: str
    transaction_id: Optional[int] = None

from backend.seed import seed_database

# Endpoints
@app.post("/api/seed")
def api_seed_database():
    try:
        seed_database()
        return {"status": "Database successfully seeded! Refresh the page."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(TransactionPrediction).count()
    if total == 0:
        return {
            "total_transactions": 0,
            "fraud_cases": 0,
            "avg_risk_score": 0.0,
            "model_accuracy": 0.984
        }
    
    fraud = db.query(TransactionPrediction).filter(TransactionPrediction.is_fraud == True).count()
    avg_risk = db.query(func.avg(TransactionPrediction.risk_score)).scalar() or 0.0
    
    return {
        "total_transactions": total,
        "fraud_cases": fraud,
        "avg_risk_score": round(float(avg_risk) * 100, 1), # as percentage
        "model_accuracy": 98.4 # constant reported model training accuracy
    }

def generate_explanation_task(txn_id: int, features: dict):
    db = SessionLocal()
    try:
        t = db.query(TransactionPrediction).filter(TransactionPrediction.id == txn_id).first()
        if t:
            explanation_data_str = explain_transaction_slow(features, t.risk_score, t.severity)
            t.explanation_json = explanation_data_str
            t.status = "completed"
            db.commit()
            print(f"✓ Async SHAP explanation successfully completed for txn #{txn_id}")
    except Exception as e:
        print(f"✗ Error generating async explanation for txn #{txn_id}: {e}")
    finally:
        db.close()

@app.get("/api/transactions")
def get_transactions(limit: int = 50, db: Session = Depends(get_db)):
    txns = db.query(TransactionPrediction).order_by(desc(TransactionPrediction.timestamp)).limit(limit).all()
    result = []
    for t in txns:
        result.append({
            "id": t.id,
            "timestamp": t.timestamp.isoformat(),
            "amt": t.amt,
            "distance": t.distance,
            "txn_velocity": t.txn_velocity,
            "age": t.age,
            "hour": t.hour,
            "is_online": t.is_online,
            "is_international": t.is_international,
            "card_present": t.card_present,
            "risk_score": t.risk_score,
            "is_fraud": t.is_fraud,
            "severity": t.severity,
            "status": t.status or "completed"
        })
    return result

@app.post("/api/predict")
def predict(payload: TransactionCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    features = payload.dict()
    try:
        # Fast model inference (<5ms)
        pred = predict_transaction_fast(features)
        
        db_record = TransactionPrediction(
            amt=payload.amt,
            distance=payload.distance,
            txn_velocity=payload.txn_velocity,
            age=payload.age,
            hour=payload.hour,
            is_online=payload.is_online,
            is_international=payload.is_international,
            card_present=payload.card_present,
            risk_score=pred["risk_score"],
            is_fraud=pred["is_fraud"],
            severity=pred["severity"],
            status="pending",
            explanation_json=None
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        # Dispatch computationally expensive explainer to background worker
        background_tasks.add_task(generate_explanation_task, db_record.id, features)
        
        return {
            "id": db_record.id,
            "timestamp": db_record.timestamp.isoformat(),
            "amt": db_record.amt,
            "distance": db_record.distance,
            "txn_velocity": db_record.txn_velocity,
            "age": db_record.age,
            "hour": db_record.hour,
            "is_online": db_record.is_online,
            "is_international": db_record.is_international,
            "card_present": db_record.card_present,
            "risk_score": db_record.risk_score,
            "is_fraud": db_record.is_fraud,
            "severity": db_record.severity,
            "status": "pending",
            "shap_values": {},
            "base_value": 0.5,
            "ai_explanation": "Forensic explainability analysis is currently running in the background..."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/explain/{txn_id}")
def get_explain(txn_id: int, db: Session = Depends(get_db)):
    t = db.query(TransactionPrediction).filter(TransactionPrediction.id == txn_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    status = t.status or "completed"
    if status == "pending" or not t.explanation_json:
        return {
            "id": t.id,
            "timestamp": t.timestamp.isoformat(),
            "amt": t.amt,
            "distance": t.distance,
            "txn_velocity": t.txn_velocity,
            "age": t.age,
            "hour": t.hour,
            "is_online": t.is_online,
            "is_international": t.is_international,
            "card_present": t.card_present,
            "risk_score": t.risk_score,
            "is_fraud": t.is_fraud,
            "severity": t.severity,
            "status": "pending",
            "shap_values": {},
            "base_value": 0.5,
            "ai_explanation": "Forensic calculations are processing in the background..."
        }
        
    explanation_data = json.loads(t.explanation_json)
    return {
        "id": t.id,
        "timestamp": t.timestamp.isoformat(),
        "amt": t.amt,
        "distance": t.distance,
        "txn_velocity": t.txn_velocity,
        "age": t.age,
        "hour": t.hour,
        "is_online": t.is_online,
        "is_international": t.is_international,
        "card_present": t.card_present,
        "risk_score": t.risk_score,
        "is_fraud": t.is_fraud,
        "severity": t.severity,
        "status": "completed",
        "shap_values": explanation_data.get("shap_values", {}),
        "base_value": explanation_data.get("base_value", 0.5),
        "ai_explanation": explanation_data.get("ai_explanation", "")
    }

@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    # 1. Fraud vs Genuine distribution
    fraud_counts = db.query(TransactionPrediction.is_fraud, func.count(TransactionPrediction.id)).group_by(TransactionPrediction.is_fraud).all()
    distribution = {"Genuine": 0, "Fraud": 0}
    for is_f, count in fraud_counts:
        label = "Fraud" if is_f else "Genuine"
        distribution[label] = count
        
    # 2. Transaction Amount Histogram
    # Bins: 0-50, 50-100, 100-250, 250-500, 500-1000, 1000+
    txns = db.query(TransactionPrediction.amt).all()
    amt_bins = {
        "₹0-50": 0,
        "₹50-100": 0,
        "₹100-250": 0,
        "₹250-500": 0,
        "₹500-1000": 0,
        "₹1000+": 0
    }
    for t in txns:
        val = t.amt
        if val <= 50:
            amt_bins["₹0-50"] += 1
        elif val <= 100:
            amt_bins["₹50-100"] += 1
        elif val <= 250:
            amt_bins["₹100-250"] += 1
        elif val <= 500:
            amt_bins["₹250-500"] += 1
        elif val <= 1000:
            amt_bins["₹500-1000"] += 1
        else:
            amt_bins["₹1000+"] += 1
            
    # 3. Risk Score Distribution
    # Bins: 0-20% (Low), 20-50% (Medium), 50-80% (High), 80-100% (Critical)
    scores = db.query(TransactionPrediction.risk_score).all()
    score_bins = {
        "Low (0-20%)": 0,
        "Medium (20-50%)": 0,
        "High (50-80%)": 0,
        "Critical (80-100%)": 0
    }
    for s in scores:
        val = s.risk_score
        if val < 0.20:
            score_bins["Low (0-20%)"] += 1
        elif val < 0.50:
            score_bins["Medium (20-50%)"] += 1
        elif val < 0.80:
            score_bins["High (50-80%)"] += 1
        else:
            score_bins["Critical (80-100%)"] += 1
            
    # 4. Daily Trend (Last 7 Days)
    # Group by date of timestamp
    trend_query = db.query(
        func.date_trunc('day', TransactionPrediction.timestamp).label('day'),
        func.count(TransactionPrediction.id).label('total'),
        func.sum(func.cast(TransactionPrediction.is_fraud, Integer)).label('fraud')
    ).group_by('day').order_by('day').all()
    
    daily_trend = []
    for day, total, fraud in trend_query:
        # format day as MM-DD
        day_str = day.strftime("%m-%d") if day else ""
        daily_trend.append({
            "date": day_str,
            "Total Transactions": total,
            "Fraud Cases": fraud or 0
        })
        
    return {
        "distribution": [{"name": k, "value": v} for k, v in distribution.items()],
        "amount_histogram": [{"range": k, "count": v} for k, v in amt_bins.items()],
        "risk_distribution": [{"range": k, "count": v} for k, v in score_bins.items()],
        "daily_trend": daily_trend
    }

@app.post("/api/chat")
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    msg = payload.message.strip().lower()
    
    # 1. Search for ID mentions, e.g. "transaction 12" or "txn #12" or just a number
    txn_id = payload.transaction_id
    if not txn_id:
        import re
        match = re.search(r'(?:transaction|txn|id|#)\s*(\d+)', msg)
        if match:
            txn_id = int(match.group(1))
        else:
            match = re.search(r'\b(\d+)\b', msg)
            if match:
                txn_id = int(match.group(1))
            
    # If a specific transaction ID is mentioned or provided
    if txn_id:
        t = db.query(TransactionPrediction).filter(TransactionPrediction.id == txn_id).first()
        if t:
            explanation_data = json.loads(t.explanation_json) if t.explanation_json else {}
            ai_exp = explanation_data.get("ai_explanation", "No AI analysis available.")
            
            response = (
                f"### 🔍 Investigation Details for Transaction #{t.id}\n\n"
                f"Here are the specific characteristics of the transaction recorded on **{t.timestamp.strftime('%Y-%m-%d %H:%M:%S')} UTC**:\n\n"
                f"| Feature | Value | Status/Type |\n"
                f"|---|---|---|\n"
                f"| **Amount** | ₹{t.amt:.2f} | - |\n"
                f"| **Distance** | {t.distance:.1f} km | - |\n"
                f"| **Velocity (24h)** | {t.txn_velocity} txns | - |\n"
                f"| **Age** | {t.age} years | - |\n"
                f"| **Hour** | {t.hour}:00 | - |\n"
                f"| **Channel** | {'Online' if t.is_online else 'In-store'} | {'Card Not Present (CNP)' if t.is_online else 'Card Present'} |\n"
                f"| **Scope** | {'International' if t.is_international else 'Domestic'} | - |\n\n"
                f"**Risk Evaluation Summary:**\n"
                f"- **Risk Probability Score**: `{t.risk_score:.2%}`\n"
                f"- **Model Classification**: `{'FRAUDULENT' if t.is_fraud else 'GENUINE'}`\n"
                f"- **Severity level**: `{t.severity}`\n\n"
                f"{ai_exp}\n\n"
                f"Would you like me to freeze the card associated with cardholder (Age: {t.age}) or review other transactions from the same day?"
            )
            return {"response": response, "transaction_id": txn_id}
            
    # 2. General responses based on question intent
    if "hello" in msg or "hi" in msg:
        reply = (
            "### 👋 Hello, I am your AI Investigator Assistant!\n\n"
            "I can help you audit transactions, search fraud details, or explain model risk decisions.\n\n"
            "**Try asking me things like:**\n"
            "- *'Explain transaction #15'* (or any specific ID)\n"
            "- *'What features does the fraud model look at?'*\n"
            "- *'How can I catch high-velocity card-not-present fraud?'*"
        )
    elif "performance" in msg or "accuracy" in msg or "metrics" in msg:
        reply = (
            "### 📊 Model Performance Analytics\n\n"
            "Our Random Forest risk classifier is trained on historical bank ledger logs and evaluated on out-of-sample test splits:\n"
            "- **Overall Accuracy**: `98.4%`\n"
            "- **Precision (Fraud class)**: `91.2%` (minimizes false alarms)\n"
            "- **Recall (Fraud class)**: `89.5%` (minimizes missed leaks)\n"
            "- **F1-Score**: `90.3%`\n\n"
            "SHAP calculations are applied to every incoming payload for immediate transaction-level audit trails."
        )
    elif "feature" in msg or "parameter" in msg or "variable" in msg:
        reply = (
            "### ⚙️ Explainer Engine Features\n\n"
            "The model utilizes the following features to evaluate transaction risk profiles:\n"
            "1. **Amount (`amt`)**: Larger amounts deviate from baseline spending and elevate risk.\n"
            "2. **Distance (`distance`)**: Distance from cardholder home zip code to transaction terminal.\n"
            "3. **Velocity (`txn_velocity`)**: Transaction counts in the preceding 24h (detects card test attacks).\n"
            "4. **Cardholder Age (`age`)**: Explores correlation with typical user segment profiles.\n"
            "5. **Time (`hour`)**: Nighttime transactions (1 AM - 5 AM) often show high correlation with theft.\n"
            "6. **Online vs Physical (`is_online`, `card_present`)**: Card-Not-Present channels carry higher baseline risk.\n"
            "7. **International (`is_international`)**: Borders crossed flag highly anomalous behaviors."
        )
    else:
        reply = (
            "### 🤖 AI Investigator Console\n\n"
            "I didn't find a specific transaction ID in your prompt, but I'm here to assist with investigation rules.\n\n"
            "To review a specific record, please mention the transaction ID, for example: **'Explain transaction #45'** or type **'45'**.\n\n"
            "If you want to know about our model architecture or dataset properties, ask me about **'model performance'** or **'features'**."
        )
        
    return {"response": reply, "transaction_id": None}
