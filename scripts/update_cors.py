import socket, http.client, json

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

import sys
TOKEN = sys.argv[1]
SUB = '82b9a34d-50bb-4d48-9cd8-dc1f134fb312'
RG = 'rg-wealthspot-prod'
APP = 'wealthspot-api'
API_VER = '2024-03-01'

# GET current config
conn = http.client.HTTPSConnection('management.azure.com', timeout=30)
path = f'/subscriptions/{SUB}/resourceGroups/{RG}/providers/Microsoft.App/containerApps/{APP}?api-version={API_VER}'
conn.request('GET', path, headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
resp = conn.getresponse()
data = json.loads(resp.read())
print('Current CORS origins:', data['properties']['configuration']['ingress']['corsPolicy']['allowedOrigins'])

# Update CORS allowed origins
data['properties']['configuration']['ingress']['corsPolicy']['allowedOrigins'] = [
    'https://app.wealthspot.in',
    'https://wealthspot.in',
    'https://www.wealthspot.in'
]

# Remove read-only fields that cause issues on PUT
for key in ['systemData']:
    data.pop(key, None)

# PUT the updated config
body = json.dumps(data).encode('utf-8')
conn2 = http.client.HTTPSConnection('management.azure.com', timeout=60)
conn2.request('PUT', path, body=body, headers={
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
})
resp2 = conn2.getresponse()
result_body = resp2.read()
print('PUT status:', resp2.status)

if resp2.status in (200, 201):
    result = json.loads(result_body)
    new_origins = result['properties']['configuration']['ingress']['corsPolicy']['allowedOrigins']
    print('SUCCESS - Updated CORS origins:', new_origins)
else:
    print('Error:', result_body[:1000].decode('utf-8', errors='replace'))
