import requests
import random
import time
from datetime import datetime

# URL for your local backend API
API_URL = "http://127.0.0.1:8000/api/predict"

def generate_random_transaction():
    """Generates a somewhat realistic, randomized transaction payload."""
    
    # Decide if we want to simulate a potentially fraudulent transaction 
    # (High amount, long distance, international, high velocity)
    is_suspicious = random.random() < 0.15 # 15% chance to be highly suspicious
    
    if is_suspicious:
        amt = round(random.uniform(500, 5000), 2)
        distance = round(random.uniform(100, 5000), 2)
        txn_velocity = random.randint(5, 20)
        hour = random.choice([0, 1, 2, 3, 4, 5]) # Night time
        is_online = True
        is_international = random.choice([True, False])
        card_present = False
    else:
        amt = round(random.uniform(5, 150), 2)
        distance = round(random.uniform(0.5, 50), 2)
        txn_velocity = random.randint(0, 3)
        hour = random.randint(6, 23)
        is_online = random.choice([True, False])
        is_international = False
        card_present = not is_online
        
    return {
        "amt": amt,
        "distance": distance,
        "txn_velocity": txn_velocity,
        "age": random.randint(18, 80),
        "hour": hour,
        "is_online": is_online,
        "is_international": is_international,
        "card_present": card_present
    }

def simulate_traffic():
    print(f"🚀 Starting continuous payment gateway simulation at {API_URL}...")
    print("Press Ctrl+C to stop.\n")
    
    count = 0
    try:
        while True:
            count += 1
            payload = generate_random_transaction()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sending transaction #{count}: ₹{payload['amt']} (Online: {payload['is_online']})")
            
            try:
                response = requests.post(API_URL, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    status = "🔴 FRAUDULENT" if data.get("is_fraud") else "🟢 GENUINE"
                    risk = data.get("risk_score", 0) * 100
                    print(f"   -> Result: {status} (Risk Score: {risk:.1f}%) | ID: {data.get('id')}\n")
                else:
                    print(f"   -> ⚠️ API Error: {response.status_code} - {response.text}\n")
            except requests.exceptions.ConnectionError:
                print("   -> ❌ Connection Error: Is the backend server running on port 8000?\n")
                
            # Wait a random time between 1 and 4 seconds before the next transaction
            time.sleep(random.uniform(1, 4))
            
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped by user. Total simulated transactions:", count)

if __name__ == "__main__":
    simulate_traffic()
