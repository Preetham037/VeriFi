import pandas as pd
import numpy as np
import joblib
import shap
import json

# Global variables for model and explainer
MODEL_PATH = "backend/fraud_model.pkl"
model = None
explainer = None
feature_names = ['amt', 'distance', 'txn_velocity', 'age', 'hour', 'is_online', 'is_international', 'card_present']

def load_model_and_explainer():
    global model, explainer
    if model is None:
        try:
            model = joblib.load(MODEL_PATH)
            explainer = shap.TreeExplainer(model)
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e

def get_severity(risk_score):
    if risk_score < 0.20:
        return "Low"
    elif risk_score < 0.50:
        return "Medium"
    elif risk_score < 0.80:
        return "High"
    else:
        return "Critical"

def predict_transaction(features_dict):
    load_model_and_explainer()
    
    # Convert input to DataFrame
    df_in = pd.DataFrame([features_dict], columns=feature_names)
    
    # Calculate risk score
    risk_score = float(model.predict_proba(df_in)[0, 1])
    is_fraud = bool(model.predict(df_in)[0])
    severity = get_severity(risk_score)
    
    # Calculate SHAP values
    shap_vals = explainer.shap_values(df_in)
    
    # Robustly parse SHAP values based on library version & shape
    if isinstance(shap_vals, list):
        # List of arrays (one per class). Class 1 is Fraud
        vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
    elif isinstance(shap_vals, np.ndarray):
        if len(shap_vals.shape) == 3: # (samples, features, classes)
            vals = shap_vals[0, :, 1]
        elif len(shap_vals.shape) == 2: # (samples, features)
            vals = shap_vals[0]
        else:
            vals = shap_vals
    else:
        if hasattr(shap_vals, "values"):
            values = shap_vals.values
            if len(values.shape) == 3:
                vals = values[0, :, 1]
            elif len(values.shape) == 2:
                vals = values[0]
            else:
                vals = values
        else:
            vals = np.zeros(len(feature_names))
            
    # Base/Expected Value
    if hasattr(explainer, "expected_value"):
        exp_val = explainer.expected_value
        if isinstance(exp_val, list) or isinstance(exp_val, np.ndarray):
            base_val = exp_val[1] if len(exp_val) > 1 else exp_val[0]
        else:
            base_val = exp_val
    else:
        base_val = 0.5

    # Convert shap values to a clean dict
    shap_dict = {feat: float(val) for feat, val in zip(feature_names, vals)}
    
    # Generate natural language AI report
    ai_explanation = generate_ai_explanation(features_dict, shap_dict, risk_score, severity)
    
    explanation_data = {
        "shap_values": shap_dict,
        "base_value": float(base_val),
        "ai_explanation": ai_explanation
    }
    
    return {
        "risk_score": risk_score,
        "is_fraud": is_fraud,
        "severity": severity,
        "explanation": json.dumps(explanation_data)
    }

def predict_transaction_fast(features_dict):
    load_model_and_explainer()
    df_in = pd.DataFrame([features_dict], columns=feature_names)
    risk_score = float(model.predict_proba(df_in)[0, 1])
    is_fraud = bool(model.predict(df_in)[0])
    severity = get_severity(risk_score)
    return {
        "risk_score": risk_score,
        "is_fraud": is_fraud,
        "severity": severity
    }

def explain_transaction_slow(features_dict, risk_score, severity):
    load_model_and_explainer()
    df_in = pd.DataFrame([features_dict], columns=feature_names)
    shap_vals = explainer.shap_values(df_in)
    
    if isinstance(shap_vals, list):
        vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
    elif isinstance(shap_vals, np.ndarray):
        if len(shap_vals.shape) == 3:
            vals = shap_vals[0, :, 1]
        elif len(shap_vals.shape) == 2:
            vals = shap_vals[0]
        else:
            vals = shap_vals
    else:
        if hasattr(shap_vals, "values"):
            values = shap_vals.values
            if len(values.shape) == 3:
                vals = values[0, :, 1]
            elif len(values.shape) == 2:
                vals = values[0]
            else:
                vals = values
        else:
            vals = np.zeros(len(feature_names))
            
    if hasattr(explainer, "expected_value"):
        exp_val = explainer.expected_value
        if isinstance(exp_val, list) or isinstance(exp_val, np.ndarray):
            base_val = exp_val[1] if len(exp_val) > 1 else exp_val[0]
        else:
            base_val = exp_val
    else:
        base_val = 0.5

    shap_dict = {feat: float(val) for feat, val in zip(feature_names, vals)}
    ai_explanation = generate_ai_explanation(features_dict, shap_dict, risk_score, severity)
    
    explanation_data = {
        "shap_values": shap_dict,
        "base_value": float(base_val),
        "ai_explanation": ai_explanation
    }
    
    return json.dumps(explanation_data)

def generate_ai_explanation(features, shap_values, score, severity):
    # Sort features by SHAP impact
    sorted_shaps = sorted(shap_values.items(), key=lambda x: x[1], reverse=True)
    positive_impacts = [x for x in sorted_shaps if x[1] > 0.01]
    negative_impacts = [x for x in sorted_shaps if x[1] < -0.01]
    
    status_text = "FRAUDULENT" if score >= 0.50 else "GENUINE"
    
    # Introduction
    narrative = f"### 🕵️ AI Investigator Forensic Report\n"
    narrative += f"The transaction has been analyzed by the **Anti-Fraud Risk Engine**. "
    narrative += f"It has been classified as **{status_text}** with a risk probability of **{score:.1%}**, yielding a **{severity}** severity level.\n\n"
    
    # Risk Indicators
    narrative += f"#### 🚨 Key Risk Indicators (Flags)\n"
    if positive_impacts:
        for feat, val in positive_impacts[:3]:
            val_text = ""
            if feat == "amt":
                val_text = f"₹{features['amt']:.2f}"
            elif feat == "distance":
                val_text = f"{features['distance']:.1f} km from home"
            elif feat == "txn_velocity":
                val_text = f"{features['txn_velocity']} txns in last 24h"
            elif feat == "age":
                val_text = f"{features['age']} years old"
            elif feat == "hour":
                val_text = f"{features['hour']}:00 hrs"
            elif feat == "is_online":
                val_text = "Online/CNP (Card Not Present)" if features['is_online'] else "In-store"
            elif feat == "is_international":
                val_text = "International Terminal" if features['is_international'] else "Domestic"
            elif feat == "card_present":
                val_text = "Physical Card Absent" if not features['card_present'] else "Physical Card Present"
                
            narrative += f"- **{feat.replace('_', ' ').title()} ({val_text})**: Contributed **+{val*100:.1f}%** to the risk score.\n"
    else:
        narrative += "- No significant risk factors detected.\n"
        
    # Mitigating Factors
    narrative += f"\n#### 🛡️ Mitigating Factors (Trust Signals)\n"
    if negative_impacts:
        for feat, val in reversed(negative_impacts[-3:]):
            val_text = ""
            if feat == "amt":
                val_text = f"₹{features['amt']:.2f}"
            elif feat == "distance":
                val_text = f"{features['distance']:.1f} km"
            elif feat == "txn_velocity":
                val_text = f"{features['txn_velocity']} txns in last 24h"
            elif feat == "age":
                val_text = f"{features['age']} years old"
            elif feat == "hour":
                val_text = f"{features['hour']}:00 hrs"
            elif feat == "is_online":
                val_text = "Online" if features['is_online'] else "In-store"
            elif feat == "is_international":
                val_text = "International" if features['is_international'] else "Domestic"
            elif feat == "card_present":
                val_text = "Physical Card Present" if features['card_present'] else "Card Absent"
                
            narrative += f"- **{feat.replace('_', ' ').title()} ({val_text})**: Reduced the risk score by **{val*100:.1f}%**.\n"
    else:
        narrative += "- No mitigating indicators found.\n"
        
    # Recommendation
    narrative += f"\n#### 📋 Recommended Action\n"
    if severity == "Critical":
        narrative += f"**CRITICAL ACTION REQUIRED**: Immediately freeze the account and block the transaction. Send an urgent push notification and SMS verification code to the cardholder to confirm activity."
    elif severity == "High":
        narrative += f"**HIGH RISK**: Temporarily hold the transaction. Queue for manual inspection by the Security Operations Center (SOC) team within 30 minutes."
    elif severity == "Medium":
        narrative += f"**MEDIUM RISK**: Approve transaction with caution. Trigger standard SMS two-factor authentication (2FA) verification post-authorization."
    else:
        narrative += f"**AUTO-APPROVE**: No anomalous signatures detected. The transaction is consistent with historical spending profiles."
        
    return narrative
