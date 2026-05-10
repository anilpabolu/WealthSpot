"""Force a new Container App revision by fetching current config and adding/updating a dummy env var."""
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

# 1. GET current Container App configuration
conn = http.client.HTTPSConnection('management.azure.com', timeout=30)
conn.request(
    'GET',
    f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{app_name}?api-version={api_version}',
    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
)
resp = conn.getresponse()
data = json.loads(resp.read())
print(f'GET status: {resp.status}')

# 2. Update the revision suffix or a label to force a new revision
props = data.get('properties', {})
template = props.get('template', {})
containers = template.get('containers', [])

# Find the api container and add/update RESTART_TRIGGER env var
for c in containers:
    if c.get('name') == 'api' or 'api' in c.get('name', '').lower():
        env_vars = c.get('env', [])
        # Find or add RESTART_TRIGGER
        found = False
        for ev in env_vars:
            if ev.get('name') == 'RESTART_TRIGGER':
                ev['value'] = 'migration-064'
                found = True
                break
        if not found:
            env_vars.append({'name': 'RESTART_TRIGGER', 'value': 'migration-064'})
        c['env'] = env_vars
        print(f'Updated env for container: {c.get("name")}')
        break

template['containers'] = containers
props['template'] = template
data['properties'] = props

# 3. PUT updated config to trigger new revision
payload = json.dumps(data).encode()
conn2 = http.client.HTTPSConnection('management.azure.com', timeout=30)
conn2.request(
    'PUT',
    f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{app_name}?api-version={api_version}',
    body=payload,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Content-Length': str(len(payload))
    }
)
resp2 = conn2.getresponse()
body2 = resp2.read()
print(f'PUT status: {resp2.status}')
try:
    resp_data = json.loads(body2)
    rev = resp_data.get('properties', {}).get('latestRevisionName', 'unknown')
    print(f'New revision: {rev}')
except:
    print('Response:', body2[:300])
