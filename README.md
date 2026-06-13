# VeriFi - AI Fraud Detection Platform

VeriFi is an AI-powered, full-stack fraud detection system designed to evaluate credit card transactions in real-time and provide detailed forensic explanations for its decisions. 

## 🚀 Features

- **Split-Second Decisions**: The core machine learning engine (Random Forest) evaluates incoming transactions in under 5 milliseconds to approve or block payments instantly.
- **AI Forensic Reports**: Calculates SHAP (SHapley Additive exPlanations) values in the background to explain *exactly* why a transaction was flagged, turning complex math into readable "Risk Indicators."
- **Investigator Dashboard**: A React-based web interface for Fraud Operations (SOC) teams to monitor global risk distribution, review flagged transactions, and view aggregate metrics.
- **Conversational AI Analyst**: Built-in chatbot where investigators can ask questions like "Explain transaction #144" to instantly fetch the reasoning behind a specific block.

## 🏗️ Architecture

- **Frontend**: React, Vite, CSS (Dashboard & Chat UI)
- **Backend API**: Python, FastAPI, SQLite (Handles instant predictions and background forensic queues)
- **Machine Learning**: Scikit-Learn (Random Forest Classifier), SHAP (Model Explainability)

## 🛠️ Local Setup

### 1. Backend Setup
Make sure you have Python installed. From the root directory:

```bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server (runs on port 8000 by default)
uvicorn backend.app:app --reload
```

### 2. Frontend Setup
Make sure you have Node.js installed. Open a second terminal:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

You can now open the local URL provided by Vite (usually `http://localhost:5173`) in your browser to view the dashboard!
