# 🛡️ VeriFi - AI Fraud Detection & SOC Ledger

VeriFi is an AI-powered, full-stack fraud detection system designed to evaluate credit card transactions in real-time and provide detailed forensic explanations for its decisions. 

## 🌐 Live Demo
- **Frontend Dashboard**: [https://veri-fi-psi.vercel.app](https://veri-fi-psi.vercel.app)
- **Backend API**: [https://verifi-191i.onrender.com](https://verifi-191i.onrender.com)

*(Note: The Render backend uses a free tier and may take ~50 seconds to spin up if it has been idle. Please wait patiently for the data to load on your first visit!)*

## 🚀 Features

- **Split-Second Decisions**: The core machine learning engine (Random Forest) evaluates incoming transactions in under 5 milliseconds to approve or block payments instantly.
- **AI Forensic Reports**: Calculates SHAP (SHapley Additive exPlanations) values in the background to explain *exactly* why a transaction was flagged, turning complex math into readable "Risk Indicators."
- **Investigator Dashboard**: A React-based web interface for Fraud Operations (SOC) teams to monitor global risk distribution, review flagged transactions, and view aggregate metrics.
- **Conversational AI Analyst**: Built-in chatbot where investigators can ask questions like "Explain transaction #45" to instantly fetch the reasoning behind a specific block.

## 🏗️ Architecture

- **Frontend**: React, Vite, CSS (Dashboard & Chat UI)
- **Backend API**: Python, FastAPI
- **Database**: PostgreSQL (Hosted on Render)
- **Machine Learning**: Scikit-Learn (Random Forest), SHAP (Model Explainability)

## 🛠️ Local Setup

### 1. Backend Setup
Make sure you have Python installed. From the root directory:

```bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn backend.app:app --reload
```

### 2. Frontend Setup
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to view the dashboard.
