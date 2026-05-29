import argparse
import asyncio
import httpx
import sys
import time

def print_header(title):
    print(f"\n{'='*50}\n{title}\n{'='*50}")

def print_result(name, passed, details=""):
    status = "[PASS]" if passed else "[FAIL]"
    msg = f"{status} | {name}"
    if details:
        msg += f" - {details}"
    print(msg)

async def test_health(client):
    start = time.time()
    try:
        r = await client.get("/health")
        duration = (time.time() - start) * 1000
        if r.status_code == 200:
            data = r.json()
            db_status = data.get('db')
            redis_status = data.get('redis')
            if db_status == 'ok' and redis_status == 'ok':
                print_result("Healthcheck", True, f"{int(duration)}ms (DB: OK, Redis: OK)")
            else:
                print_result("Healthcheck", False, f"DB: {db_status}, Redis: {redis_status}")
                return False
        else:
            print_result("Healthcheck", False, f"HTTP {r.status_code}")
            return False
    except Exception as e:
        print_result("Healthcheck", False, str(e))
        return False
    return True

async def test_opportunities(client):
    start = time.time()
    try:
        r = await client.get("/api/v1/opportunities")
        duration = (time.time() - start) * 1000
        if r.status_code == 200:
            data = r.json()
            total = data.get('total', 0)
            items = len(data.get('items', []))
            print_result("List Opportunities", True, f"{int(duration)}ms (Total: {total}, Returned: {items})")
        else:
            print_result("List Opportunities", False, f"HTTP {r.status_code}")
            return False
    except Exception as e:
        print_result("List Opportunities", False, str(e))
        return False
    return True

async def test_vault_stats(client):
    start = time.time()
    try:
        r = await client.get("/api/v1/opportunities/vault-stats")
        duration = (time.time() - start) * 1000
        if r.status_code == 200:
            data = r.json()
            vault_types = [v.get('vault_type') for v in data]
            print_result("Vault Stats", True, f"{int(duration)}ms (Vault Types: {', '.join(vault_types)})")
        else:
            print_result("Vault Stats", False, f"HTTP {r.status_code}")
            return False
    except Exception as e:
        print_result("Vault Stats", False, str(e))
        return False
    return True

async def test_form_options(client):
    start = time.time()
    try:
        r = await client.get("/api/v1/opportunities/form-options")
        duration = (time.time() - start) * 1000
        if r.status_code == 200:
            data = r.json()
            fields = list(data.keys())
            print_result("Form Options", True, f"{int(duration)}ms (Fields: {len(fields)})")
        else:
            print_result("Form Options", False, f"HTTP {r.status_code}")
            return False
    except Exception as e:
        print_result("Form Options", False, str(e))
        return False
    return True

async def main():
    parser = argparse.ArgumentParser(description="WealthSpot API E2E Integration Tests")
    parser.add_argument("--env", choices=["local", "prod"], default="local", help="Target environment")
    args = parser.parse_args()

    base_url = "http://localhost:8000" if args.env == "local" else "https://api.wealthspot.in"
    print_header(f"Starting E2E Tests against: {base_url} ({args.env.upper()})")

    async with httpx.AsyncClient(base_url=base_url, timeout=15.0) as client:
        success = True
        success &= await test_health(client)
        success &= await test_opportunities(client)
        success &= await test_vault_stats(client)
        success &= await test_form_options(client)
        
        # We only run write flows (Mock auth & EOI creation) on local to avoid polluting production
        if args.env == "local":
            print_header("Local Write Tests (Not implemented yet - mocking EOI)")
            # Add local EOI creation tests if needed, though they require a valid access token.
            pass

    print_header("Test Execution Complete")
    if not success:
        print("Status: FAILED")
        sys.exit(1)
    else:
        print("Status: ALL PASSED")

if __name__ == "__main__":
    asyncio.run(main())
