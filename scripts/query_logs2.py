"""Query Log Analytics for full error details."""
import socket, http.client, json, sys

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

token = sys.argv[1]
workspace_id = '4cf52500-8564-4ba2-bbdf-714d4d2ef908'

query = """
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == 'wealthspot-api'
| where Log_s contains 'rate_limit'
| order by TimeGenerated desc
| take 5
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
data = json.loads(resp.read())
tables = data.get('tables', [])
if tables:
    rows = tables[0].get('rows', [])
    for row in rows:
        print(f'TIME: {row[0]}')
        log = row[1]
        try:
            log_obj = json.loads(log)
            print(f'MSG: {log_obj.get("message")}')
            exc = log_obj.get('exception') or log_obj.get('exc_info') or log_obj.get('error') or log_obj.get('traceback')
            if exc:
                print(f'EXC: {exc}')
            # Print all keys  
            for k, v in log_obj.items():
                if k not in ('message', 'timestamp', 'level', 'logger', 'module'):
                    print(f'  {k}: {str(v)[:300]}')
        except:
            print(f'RAW: {log[:500]}')
        print('---')
