import requests
import csv
import json

CSV_PATH = 'searchHubsResponse (67).csv'
API_URL = 'https://ammko.vercel.app/api/stores'

def sync_data():
    print("Fetching live data from Vercel KV...")
    response = requests.get(API_URL)
    if response.status_code != 200:
        print(f"Failed to fetch live data. Status code: {response.status_code}")
        return
    
    live_data = response.json()
    existing_stores = live_data.get('stores', [])
    store_map = {store['id']: store for store in existing_stores}
    print(f"Loaded {len(store_map)} existing stores from KV.")
    
    print(f"Parsing new CSV: {CSV_PATH}")
    csv_stores = {}
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            store_id = row.get('Store ID')
            if not store_id: continue
            
            # Use the first row encountered for basic store info
            if store_id not in csv_stores:
                geocodes = row.get('Geocodes', '')
                lat, lng = 0.0, 0.0
                if geocodes and ',' in geocodes:
                    parts = geocodes.split(',')
                    try:
                        lat = float(parts[0].strip().replace('"', ''))
                        lng = float(parts[1].strip().replace('"', ''))
                    except ValueError:
                        pass
                
                # Make sure 2000 is 475
                radius_str = row.get('Delivery Radius', '')
                if '2000' in radius_str:
                    radius_str = '475 METRE'
                    
                csv_stores[store_id] = {
                    'id': store_id,
                    'name': row.get('Store Name', ''),
                    'status': 'active' if 'active' in row.get('Status', '').lower() else 'inactive',
                    'email': '',  # CSV doesn't seem to have email in the preview, wait it might? The headers I printed didn't have email.
                    'phone': '',
                    'radius': radius_str,
                    'lat': lat,
                    'lng': lng
                }

    print(f"Found {len(csv_stores)} unique stores in CSV.")
    
    # Merge Phase
    new_stores_added = 0
    status_updated = 0
    
    final_stores = []
    
    # Process all stores from CSV
    for store_id, csv_store in csv_stores.items():
        if store_id in store_map:
            # Store exists in KV. Update status, name, radius.
            kv_store = store_map[store_id]
            if kv_store['status'] != csv_store['status']:
                status_updated += 1
                
            kv_store['status'] = csv_store['status']
            kv_store['name'] = csv_store['name']
            kv_store['radius'] = csv_store['radius']
            
            # DO NOT overwrite lat/lng if KV has valid ones, unless KV is 0/0
            if (not kv_store.get('lat') or kv_store['lat'] == 0) and csv_store['lat'] != 0:
                kv_store['lat'] = csv_store['lat']
                kv_store['lng'] = csv_store['lng']
                
            # If KV doesn't have phone, use CSV if available (though CSV header didn't show phone)
            
            final_stores.append(kv_store)
            # Remove from store_map to track what's left
            del store_map[store_id]
        else:
            # New store
            new_stores_added += 1
            final_stores.append(csv_store)
            
    # Add any remaining stores from KV that were NOT in CSV
    for store_id, kv_store in store_map.items():
        # Maybe mark them inactive?
        kv_store['status'] = 'inactive'
        final_stores.append(kv_store)
        
    print(f"Merge complete. New stores added: {new_stores_added}. Status updates: {status_updated}. Total stores: {len(final_stores)}")
    
    print("Uploading to Vercel KV...")
    payload = {
        'stores': final_stores
    }
    
    post_res = requests.post(API_URL, json=payload)
    if post_res.status_code == 200:
        print("Successfully synced data to Vercel KV!")
    else:
        print(f"Failed to sync data. Status: {post_res.status_code}")
        print(post_res.text)

if __name__ == '__main__':
    sync_data()
