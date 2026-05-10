import socket, http.client, json

old_gai = socket.getaddrinfo
def ipv4_only(h, p, f=0, t=0, pr=0, fl=0):
    return old_gai(h, p, socket.AF_INET, t, pr, fl)
socket.getaddrinfo = ipv4_only

fqdn = 'wealthspot-api.lemonpebble-c808abb2.centralindia.azurecontainerapps.io'

conn = http.client.HTTPSConnection(fqdn, timeout=30)
conn.request('GET', '/health', headers={'Accept': 'application/json'})
resp = conn.getresponse()
body = resp.read().decode()
print('Health:', resp.status, body[:200])

conn2 = http.client.HTTPSConnection(fqdn, timeout=30)
conn2.request('GET', '/api/v1/opportunities', headers={'Accept': 'application/json'})
resp2 = conn2.getresponse()
body2 = resp2.read().decode()
print('Opportunities:', resp2.status, body2[:400])
