import redis

url = "rediss://default:gQAAAAAAAcl3AAIgcDI5NzU1YmZlNjliYmE0NjliOTM2OGVlZGMyODFjZjE0Mw@thankful-oriole-117111.upstash.io:6379"
print(f"Connecting to {url}...")

try:
    r = redis.from_url(url, socket_connect_timeout=5)
    r.ping()
    print("Redis connection successful!")
except Exception as e:
    print(f"Redis connection failed: {e}")
