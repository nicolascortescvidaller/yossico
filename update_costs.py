import urllib.request
import json

SUPABASE_URL = "https://mgzevtcipwfpqgolmpwm.supabase.co"
ANON_KEY = "sb_publishable_1bxubqO9tCMdrCTuWj9CKA_irvrSa19"

# Calculate costs
TRM = 4000
extras_per_unit_usd = 1000 / 600

costs = {
    "KYOTO": round((17.89 + extras_per_unit_usd) * TRM),
    "MILAN": round((16.89 + extras_per_unit_usd) * TRM),
    "LIMA": round((11.89 + extras_per_unit_usd) * TRM),
    "OSLO": round((10.89 + extras_per_unit_usd) * TRM),
    "BOGOTÁ": round((6.89 + extras_per_unit_usd) * TRM),
    "MANTA": round((7.20 + extras_per_unit_usd) * TRM)
}

print("Calculated costs (COP):", costs)

# Update each model via REST API
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

for name, cop in costs.items():
    url = f"{SUPABASE_URL}/rest/v1/productos?nombre=eq.{urllib.parse.quote(name)}"
    data = json.dumps({"costo_produccion": cop}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='PATCH')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Updated {name} to {cop} COP. Status: {response.status}")
    except Exception as e:
        print(f"Failed to update {name}: {e}")

