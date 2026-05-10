import os, socket, http.client, json

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

CF_TOKEN = os.environ['CF_ZONE_TOKEN']
ZONE_ID = '1143de4943832f36fe72fb5459a69920'
CONTAINER_APP_FQDN = 'wealthspot-api.lemonpebble-c808abb2.centralindia.azurecontainerapps.io'

headers = {
    'Authorization': f'Bearer {CF_TOKEN}',
    'Content-Type': 'application/json'
}

def cf_request(method, path, body=None):
    conn = http.client.HTTPSConnection('api.cloudflare.com', timeout=30)
    conn.request(method, path, body=json.dumps(body).encode() if body else None, headers=headers)
    resp = conn.getresponse()
    return resp.status, json.loads(resp.read())

# Check existing DNS records for api.wealthspot.in
status, data = cf_request('GET', f'/client/v4/zones/{ZONE_ID}/dns_records?name=api.wealthspot.in')
print(f'GET api records status: {status}, count: {len(data.get("result", []))}')
existing_api = data.get('result', [])

# Check existing DNS records for www.wealthspot.in
status2, data2 = cf_request('GET', f'/client/v4/zones/{ZONE_ID}/dns_records?name=www.wealthspot.in')
print(f'GET www records status: {status2}, count: {len(data2.get("result", []))}')
existing_www = data2.get('result', [])

# Add api.wealthspot.in CNAME if not exists
if not existing_api:
    body = {
        'type': 'CNAME',
        'name': 'api',
        'content': CONTAINER_APP_FQDN,
        'proxied': False,  # NOT proxied - Container App needs direct TLS
        'ttl': 1
    }
    s3, d3 = cf_request('POST', f'/client/v4/zones/{ZONE_ID}/dns_records', body)
    if d3.get('success'):
        print(f'Created api.wealthspot.in CNAME -> {CONTAINER_APP_FQDN}')
    else:
        print(f'Failed to create api CNAME: {d3.get("errors")}')
else:
    print(f'api.wealthspot.in already exists: {existing_api[0].get("type")} -> {existing_api[0].get("content")}')

# Add www.wealthspot.in CNAME if not exists
# www should point to CF Pages (proxied via CF)
if not existing_www:
    body2 = {
        'type': 'CNAME',
        'name': 'www',
        'content': 'wealthspot-web.pages.dev',
        'proxied': True,  # Proxied - CF Pages handles SSL
        'ttl': 1
    }
    s4, d4 = cf_request('POST', f'/client/v4/zones/{ZONE_ID}/dns_records', body2)
    if d4.get('success'):
        print(f'Created www.wealthspot.in CNAME -> wealthspot-web.pages.dev (proxied)')
    else:
        print(f'Failed to create www CNAME: {d4.get("errors")}')
else:
    print(f'www.wealthspot.in already exists: {existing_www[0].get("type")} -> {existing_www[0].get("content")}')

# Check root domain records
status5, data5 = cf_request('GET', f'/client/v4/zones/{ZONE_ID}/dns_records?name=wealthspot.in')
print(f'Root domain records: {len(data5.get("result", []))}')
for r in data5.get('result', []):
    print(f'  {r["type"]} {r["name"]} -> {r["content"]}')
