"""Add custom domain api.wealthspot.in to Container App via ARM REST API."""
import socket, http.client, json, sys

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

token = sys.argv[1]
sub = '82b9a34d-50bb-4d48-9cd8-dc1f134fb312'
rg = 'rg-wealthspot-prod'
app_name = 'wealthspot-api'
hostname = 'api.wealthspot.in'
api_version = '2023-05-01'

# GET current app config
conn = http.client.HTTPSConnection('management.azure.com', timeout=30)
conn.request(
    'GET',
    f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{app_name}?api-version={api_version}',
    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
)
resp = conn.getresponse()
data = json.loads(resp.read())
print(f'GET status: {resp.status}')

props = data.get('properties', {})
config = props.get('configuration', {})
ingress = config.get('ingress', {})
custom_domains = ingress.get('customDomains') or []

# Check if hostname already present
existing = [d for d in custom_domains if d.get('name') == hostname]
if existing:
    print(f'Hostname {hostname} already configured')
else:
    # Add new custom domain (no certificate initially — will use managed cert)
    custom_domains.append({
        'name': hostname,
        'bindingType': 'Disabled'  # Start with disabled, then bind cert separately
    })
    ingress['customDomains'] = custom_domains
    config['ingress'] = ingress
    props['configuration'] = config
    data['properties'] = props

    payload = json.dumps(data).encode()
    conn2 = http.client.HTTPSConnection('management.azure.com', timeout=60)
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
        r = json.loads(body2)
        print(f'Custom domains now: {[d.get("name") for d in r.get("properties", {}).get("configuration", {}).get("ingress", {}).get("customDomains", [])]}')
    except:
        print('Response:', body2[:500])
