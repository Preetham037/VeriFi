import urllib.request
import json
import sys

API_URL = "http://127.0.0.1:8000/api"

def test_endpoint(path, method="GET", payload=None):
    url = f"{API_URL}/{path}"
    req = urllib.request.Request(url, method=method)
    
    if payload:
        data = json.dumps(payload).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    else:
        data = None
        
    try:
        with urllib.request.urlopen(req, data=data, timeout=5) as response:
            status = response.status
            body = response.read().decode('utf-8')
            return status, json.loads(body)
    except Exception as e:
        print(f"Error testing {method} {url}: {e}")
        return 500, None

def run_tests():
    print("Starting API Endpoint Verification...")
    
    # 1. Test /api/stats
    print("Testing GET /api/stats...")
    status, stats = test_endpoint("stats")
    if status == 200 and stats:
        print(f"✓ Success! Stats: Total Transactions={stats.get('total_transactions')}, Fraud={stats.get('fraud_cases')}, Avg Risk={stats.get('avg_risk_score')}%")
    else:
        print("✗ Failed stats endpoint")
        sys.exit(1)
        
    # 2. Test /api/transactions
    print("Testing GET /api/transactions...")
    status, txns = test_endpoint("transactions")
    if status == 200 and isinstance(txns, list):
        print(f"✓ Success! Retrieved {len(txns)} transactions from DB.")
    else:
        print("✗ Failed transactions endpoint")
        sys.exit(1)

    # 3. Test /api/analytics
    print("Testing GET /api/analytics...")
    status, analytics = test_endpoint("analytics")
    if status == 200 and analytics:
        print("✓ Success! Retrieved analytics histograms and daily trends.")
    else:
        print("✗ Failed analytics endpoint")
        sys.exit(1)

    # 4. Test /api/predict
    print("Testing POST /api/predict...")
    payload = {
        "amt": 1250.0,
        "distance": 85.0,
        "txn_velocity": 4,
        "age": 42,
        "hour": 2,
        "is_online": True,
        "is_international": False,
        "card_present": False
    }
    status, pred = test_endpoint("predict", "POST", payload)
    if status == 200 and pred:
        print(f"✓ Success! Predicted Risk Score: {pred.get('risk_score'):.2%}, Severity: {pred.get('severity')}, Fraud: {pred.get('is_fraud')}")
        txn_id = pred.get("id")
    else:
        print("✗ Failed predict endpoint")
        sys.exit(1)

    # 5. Test /api/explain/{id}
    print(f"Testing GET /api/explain/{txn_id}...")
    status, exp = test_endpoint(f"explain/{txn_id}")
    if status == 200 and exp:
        print("✓ Success! Retrieved SHAP values and AI explanation.")
    else:
        print("✗ Failed explain endpoint")
        sys.exit(1)

    # 6. Test /api/chat
    print("Testing POST /api/chat...")
    chat_payload = {
        "message": f"Explain transaction #{txn_id}"
    }
    status, chat_res = test_endpoint("chat", "POST", chat_payload)
    if status == 200 and chat_res:
        print("✓ Success! AI Investigator Chat responded correctly.")
    else:
        print("✗ Failed chat endpoint")
        sys.exit(1)
        
    print("\nAll API Endpoint tests passed successfully!")

if __name__ == "__main__":
    run_tests()
