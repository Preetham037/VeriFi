import requests
import random
import time
from datetime import datetime

# URL for your local backend API
API_URL = "http://localhost:8000/api/predict"

# Major global financial hubs (lat, lng)
HUBS = [
    (40.7128, -74.0060), # New York
    (51.5074, -0.1278),  # London
    (35.6762, 139.6503), # Tokyo
    (19.0760, 72.8777),  # Mumbai
    (1.3521, 103.8198),  # Singapore
    (-33.8688, 151.2093) # Sydney
]

def generate_random_transaction():
    """Generates a somewhat realistic, randomized transaction payload."""
    
    # Pick a random hub and add some jitter
    hub_lat, hub_lng = random.choice(HUBS)
    lat = hub_lat + random.uniform(-2.0, 2.0)
    lng = hub_lng + random.uniform(-2.0, 2.0)

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
        # Further randomize fraud locations
        lat = lat + random.uniform(-10.0, 10.0)
        lng = lng + random.uniform(-10.0, 10.0)
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
        "card_present": card_present,
        "latitude": lat,
        "longitude": lng
    }

def simulate_traffic():
    print(f"🚀 Starting continuous payment gateway simulation at {API_URL}...")
    print("Press Ctrl+C to stop.\n")
    
    # Authenticate as admin
    auth_url = "http://localhost:8000/api/auth/login" if API_URL.startswith("http://localhost") else "https://verifi-191i.onrender.com/api/auth/login"
    try:
        auth_res = requests.post(auth_url, data={"username": "admin", "password": "admin123"})
        auth_res.raise_for_status()
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Authenticated as admin successfully.\n")
    except Exception as e:
        print(f"❌ Failed to authenticate as admin. Ensure the backend is running and the admin user exists. Error: {e}")
        return

    count = 0
    try:
        while True:
            count += 1
            payload = generate_random_transaction()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sending transaction #{count}: ₹{payload['amt']} (Online: {payload['is_online']})")
            
            try:
                response = requests.post(API_URL, json=payload, headers=headers)
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
