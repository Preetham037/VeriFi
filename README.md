# 🛡️ VeriFi - AI Fraud Detection & SOC Ledger

VeriFi is an enterprise-grade, full-stack fraud detection platform. It evaluates credit card transactions in real-time, provides highly detailed forensic explanations for its decisions using SHAP values, and features an integrated AI copilot to assist Security Operations Center (SOC) analysts.

## 🌐 Live Demo
- **Frontend Dashboard**: [https://veri-fi-psi.vercel.app](https://veri-fi-psi.vercel.app)
- **Backend API**: [https://verifi-191i.onrender.com](https://verifi-191i.onrender.com)

*(Note: The Render backend uses a free tier and may take ~50 seconds to spin up if it has been idle. Please wait patiently for the data to load on your first visit!)*

### 🔑 Demo Access
The platform is secured with a custom JWT authentication system. You can log in using the following administrator credentials:
- **Username**: `admin`
- **Password**: `admin123`

---

## 🚀 Key Features

### 1. Split-Second Machine Learning Engine
The core ML engine (Random Forest) evaluates incoming transactions in under 5 milliseconds to approve or block payments instantly based on distance, velocity, and transaction history.

### 2. SHAP Forensic Explainability
Calculates SHAP (SHapley Additive exPlanations) values asynchronously in the background to explain *exactly* why a transaction was flagged, turning complex math into readable "Risk Indicators."

### 3. Geospatial Hotspot Mapping
Features a live, interactive 2D map utilizing `react-leaflet` to visualize real-time transaction traffic across major global financial hubs. Fraudulent transactions pulse in red, allowing analysts to instantly spot geographical attack clusters.

### 4. Link Analysis (Network Graphs)
Visualizes relationships between users, devices, and transactions. Highly connected nodes indicate coordinated fraud rings, which are mapped out using `react-force-graph`.

### 5. AI Investigator Copilot
A built-in AI assistant powered by Google Gemini. Analysts can click "Investigate with AI" on any transaction to instantly fetch a conversational, natural-language explanation of the risk factors and recommended actions.

### 6. Role-Based Access Control (RBAC)
Custom JWT Authentication with Bcrypt password hashing.
- **Admins** have full control to simulate transactions and configure rules.
- **Analysts** have read-only access to investigate alerts and view the dashboards.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React, Vite, Recharts, React-Leaflet, React-Force-Graph
- **Backend API**: Python, FastAPI
- **Security**: Custom JWT Auth (`python-jose`, `bcrypt`)
- **Database**: PostgreSQL (Hosted on Render)
- **Machine Learning**: Scikit-Learn (Random Forest), SHAP (Model Explainability)
- **Generative AI**: Google Gemini API (`gemini-flash-lite-latest`)

---

## 📸 Screenshots & Demo

*(Add a GIF or link to a Loom video demonstrating the platform here)*

*(Add screenshots of the Dashboard, Map, and Link Analysis here)*

---

## 🛠️ Local Setup

### 1. Backend Setup
Make sure you have Python installed. From the root directory:

```bash
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set Environment Variables
# Create a .env file and add your GEMINI_API_KEY and DATABASE_URL
# Example:
# GEMINI_API_KEY="AIzaSyYourKeyHere..."
# DATABASE_URL="postgresql://user:pass@localhost:5432/verifi"
# JWT_SECRET="your_secure_secret_key"

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

### 3. Simulating Live Traffic
To watch the dashboard and maps update in real-time, open a third terminal and run the traffic generator script. This will automatically authenticate as the admin and stream simulated transactions to the backend:

```bash
source .venv/bin/activate
python simulate_traffic.py
```
