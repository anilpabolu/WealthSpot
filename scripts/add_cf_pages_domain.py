"""Add www.wealthspot.in as custom domain to Cloudflare Pages project."""
import os, socket, http.client, json

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

pages_token = os.environ['CF_PAGES_TOKEN']

# Use /client/v4/accounts/{account_id}/pages/projects/{project} directly
# Need to find account ID first — try the zone token to get account info
zone_token = os.environ['CF_ZONE_TOKEN']
zone_id = '1143de4943832f36fe72fb5459a69920'

# Get account ID from zone info
conn = http.client.HTTPSConnection('api.cloudflare.com', timeout=30)
conn.request(
    'GET', f'/client/v4/zones/{zone_id}',
    headers={'Authorization': f'Bearer {zone_token}'}
)
resp = conn.getresponse()
body = json.loads(resp.read())
print(f'Zone GET status: {resp.status}')
account_id = None
if body.get('success'):
    account_id = body['result']['account']['id']
    print(f'Account ID: {account_id}')
else:
    print('Error:', body.get('errors'))

if account_id:
    # Add www.wealthspot.in
    domain = 'www.wealthspot.in'
    payload = json.dumps({'name': domain}).encode()
    conn2 = http.client.HTTPSConnection('api.cloudflare.com', timeout=30)
    conn2.request(
        'POST', f'/client/v4/accounts/{account_id}/pages/projects/wealthspot-web/domains',
        body=payload,
        headers={
            'Authorization': f'Bearer {pages_token}',
            'Content-Type': 'application/json',
            'Content-Length': str(len(payload))
        }
    )
    resp2 = conn2.getresponse()
    body2 = json.loads(resp2.read())
    print(f'\nAdd domain POST status: {resp2.status}')
    print(f'Success: {body2.get("success")}')
    if body2.get('result'):
        print(f'Result: {body2["result"]}')
    if body2.get('errors'):
        print(f'Errors: {body2["errors"]}')
