import random
import json
import requests

BASE_URL = "http://127.0.0.1:8000/api"
AUTH_URL = f"{BASE_URL}/auth/login/"
RECOMMENDATION_URL = f"{BASE_URL}/events/recommendation/"

def test_random_dataset_participant():
    print("=" * 50)
    print("🧪 TESTING RECOMMENDATIONS WITH RANDOM DATASET PARTICIPANT")
    print("=" * 50)

    # Updated range: Participants in your new 100-user dataset range from user_11 to user_100
    random_id = random.randint(11, 100)
    username = f"user_{random_id}"
    password = "password123"

    print(f"\n[1] Automatically picked random user: {username} (ID: {random_id})")

    # 1. Log in using the pre-seeded dataset credentials
    print("Logging in...")
    login_res = requests.post(AUTH_URL, json={"username": username, "password": password})
    
    if login_res.status_code != 200:
        print(f"❌ Login failed for {username} (Status {login_res.status_code}):")
        print(login_res.text)
        print("Tip: Make sure you ran your generator and data import scripts so these users exist in your database.")
        return

    token = login_res.json().get("access")
    print(f"✅ Successfully authenticated as {username}.")

    # 2. Request personalized recommendations
    print("\n[2] Requesting personalized recommendations...")
    headers = {"Authorization": f"Bearer {token}"}
    rec_res = requests.get(RECOMMENDATION_URL, headers=headers)

    print(f"Status Code: {rec_res.status_code}")
    print("-" * 50)
    
    if rec_res.status_code == 200:
        print("✅ Recommendations fetched successfully:\n")
        try:
            events = rec_res.json()
            print(json.dumps(events, indent=2))
            print(f"\nTotal recommendations returned: {len(events)}")
        except Exception:
            print(rec_res.text)
    else:
        print("❌ Failed to fetch recommendations:")
        print(rec_res.text)
    print("-" * 50)

if __name__ == "__main__":
    test_random_dataset_participant()