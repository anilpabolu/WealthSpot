"""Fetch Container App logs via ARM workspace/Log Analytics."""
import socket, http.client, json, sys

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

token = sys.argv[1]
sub = '82b9a34d-50bb-4d48-9cd8-dc1f134fb312'
rg = 'rg-wealthspot-prod'
app_name = 'wealthspot-api'
api_version = '2023-05-01'

# Get container app to find log analytics workspace
conn = http.client.HTTPSConnection('management.azure.com', timeout=30)
conn.request(
    'GET',
    f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/managedEnvironments?api-version={api_version}',
    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
)
resp = conn.getresponse()
data = json.loads(resp.read())
print(f'Managed envs: {json.dumps(data, indent=2)[:2000]}')
