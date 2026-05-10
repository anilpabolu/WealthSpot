"""Query Log Analytics for Container App errors."""
import socket, http.client, json, sys

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

token = sys.argv[1]
workspace_id = '4cf52500-8564-4ba2-bbdf-714d4d2ef908'

# Query for recent errors
query = """
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == 'wealthspot-api'
| where Log_s contains 'Error' or Log_s contains 'error' or Log_s contains 'Traceback' or Log_s contains 'exception'
| order by TimeGenerated desc
| take 30
| project TimeGenerated, Log_s
"""

payload = json.dumps({'query': query, 'timespan': 'PT1H'}).encode()
conn = http.client.HTTPSConnection('api.loganalytics.io', timeout=30)
conn.request(
    'POST',
    f'/v1/workspaces/{workspace_id}/query',
    body=payload,
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Content-Length': str(len(payload))
    }
)
resp = conn.getresponse()
body = resp.read()
print(f'Status: {resp.status}')
try:
    data = json.loads(body)
    tables = data.get('tables', [])
    if tables:
        rows = tables[0].get('rows', [])
        print(f'Got {len(rows)} log entries:')
        for row in rows:
            print(f'  {row[0]}: {row[1][:200]}')
    else:
        print('No tables:', json.dumps(data, indent=2)[:1000])
except Exception as e:
    print('Error:', e, body[:500])
