import urllib.request
import urllib.error

try:
    res = urllib.request.urlopen('https://api.wealthspot.in/health')
    print(res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode('utf-8'))
