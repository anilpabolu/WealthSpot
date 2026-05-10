"""Fetch Container App log stream using ARM API"""
import socket, http.client, json, sys

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

token = sys.argv[1]
sub = '82b9a34d-50bb-4d48-9cd8-dc1f134fb312'
rg = 'rg-wealthspot-prod'
app_name = 'wealthspot-api'

# Get list of revisions first
conn = http.client.HTTPSConnection('management.azure.com', timeout=30)
conn.request(
    'GET',
    f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{app_name}/revisions?api-version=2023-05-01',
    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
)
resp = conn.getresponse()
data = json.loads(resp.read())
revisions = data.get('value', [])
for r in revisions[-3:]:
    props = r.get('properties', {})
    print(f"Revision: {r['name']} | Active: {props.get('active')} | Traffic: {props.get('trafficWeight')} | Replicas: {props.get('replicas')}")
