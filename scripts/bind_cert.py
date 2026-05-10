"""Create managed certificate and bind to api.wealthspot.in on Container App."""
import socket, http.client, json, sys, time

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

token = sys.argv[1]
sub = '82b9a34d-50bb-4d48-9cd8-dc1f134fb312'
rg = 'rg-wealthspot-prod'
app_name = 'wealthspot-api'
hostname = 'api.wealthspot.in'
env_name = 'cae-wealthspot-prod'
cert_name = 'api-wealthspot-in-cert'
api_version = '2023-05-01'

# Create managed certificate in the Container App Environment
conn = http.client.HTTPSConnection('management.azure.com', timeout=30)
cert_payload = json.dumps({
    "location": "centralindia",
    "properties": {
        "subjectName": hostname,
        "domainControlValidation": "CNAME"
    }
}).encode()

cert_url = f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/managedEnvironments/{env_name}/managedCertificates/{cert_name}?api-version={api_version}'
conn.request(
    'PUT', cert_url, body=cert_payload,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Content-Length': str(len(cert_payload))
    }
)
resp = conn.getresponse()
body = resp.read()
print(f'Create cert status: {resp.status}')
try:
    r = json.loads(body)
    print(f'Cert ID: {r.get("id")}')
    print(f'Provision state: {r.get("properties", {}).get("provisioningState")}')
    cert_id = r.get("id")
except:
    print('Response:', body[:500])
    sys.exit(1)

print(f'\nCert created. Now update Container App to bind cert...')
# GET current app config
conn2 = http.client.HTTPSConnection('management.azure.com', timeout=30)
conn2.request(
    'GET',
    f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{app_name}?api-version={api_version}',
    headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
)
resp2 = conn2.getresponse()
data = json.loads(resp2.read())

props = data.get('properties', {})
ingress = props.get('configuration', {}).get('ingress', {})
custom_domains = ingress.get('customDomains') or []

# Update binding for our hostname
updated_domains = []
for d in custom_domains:
    if d.get('name') == hostname:
        updated_domains.append({
            'name': hostname,
            'certificateId': cert_id,
            'bindingType': 'SniEnabled'
        })
    else:
        updated_domains.append(d)

ingress['customDomains'] = updated_domains
props['configuration']['ingress'] = ingress
data['properties'] = props

payload = json.dumps(data).encode()
conn3 = http.client.HTTPSConnection('management.azure.com', timeout=90)
conn3.request(
    'PUT',
    f'/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/containerApps/{app_name}?api-version={api_version}',
    body=payload,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Content-Length': str(len(payload))
    }
)
resp3 = conn3.getresponse()
body3 = resp3.read()
print(f'Bind cert status: {resp3.status}')
try:
    r3 = json.loads(body3)
    domains = r3.get('properties', {}).get('configuration', {}).get('ingress', {}).get('customDomains', [])
    for d in domains:
        print(f'  {d.get("name")}: bindingType={d.get("bindingType")}')
except:
    print('Response:', body3[:500])
