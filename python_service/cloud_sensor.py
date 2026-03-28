import os
import time
import random
import firebase_admin
from firebase_admin import credentials, firestore

# Expected location of the downloaded service account key
SERVICE_ACCOUNT_FILE = "serviceAccountKey.json"

def main():
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"Error: {SERVICE_ACCOUNT_FILE} not found!")
        print("Please download it from Firebase Console -> Project Settings -> Service Accounts")
        print("and place it in the python_service directory.")
        return

    # Initialize Firebase from service account
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    STATION_IDS = ["Tokyo", "London", "New York"]

    def insert_station(station_id):
        docs = db.collection('sensors').document(station_id)
        docs.set({
            'stationID': station_id,
            'temperature': random.uniform(10, 35),
            'humidity': random.uniform(30, 90),
            'windSpeed': random.uniform(0, 30),
            'precipitation': random.uniform(0, 5),
            'timestamp': firestore.SERVER_TIMESTAMP
        })
        print(f"Inserted/Modified station {station_id}")

    def delete_station(station_id):
        db.collection('sensors').document(station_id).delete()
        print(f"Deleted station {station_id}")

    def retrieve_all():
        docs = db.collection('sensors').stream()
        print("Current data in Firestore:")
        for doc in docs:
            print(f"  {doc.id} => {doc.to_dict()}")

    print("--- Demonstrating Firebase CRUD ---")
    
    # 1. Insert
    print("\n[1] Inserting data...")
    for s_id in STATION_IDS:
        insert_station(s_id)
    
    # 2. Retrieve
    print("\n[2] Retrieving data...")
    retrieve_all()
    
    # 3. Modify
    print("\n[3] Modifying Tokyo...")
    insert_station("Tokyo")  # Overwrites with new values
    
    # 4. Delete
    print("\n[4] Deleting New York...")
    delete_station("New York")
    
    print("\n--- Final State ---")
    retrieve_all()

    print("\n--- Continuous Real-time Update Mode ---")
    print("Updating random cities every 5 seconds to trigger frontend notifications.")
    print("Press Ctrl+C to exit.")
    
    try:
        while True:
            insert_station(random.choice(["Tokyo", "London"]))
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nExiting...")

if __name__ == "__main__":
    main()
