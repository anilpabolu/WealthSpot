"""
WealthSpot API Performance Tests (Locust).

Run with:
  locust -f tests/performance/locustfile.py --headless -u 50 -r 10 -t 60s --host http://localhost:8000

Or with UI:
  locust -f tests/performance/locustfile.py --host http://localhost:8000
"""
import os
import json
from locust import HttpUser, task, between, events


# Auth token for test user — set via env var or hardcode for local testing
AUTH_TOKEN = os.environ.get("PERF_AUTH_TOKEN", "")


def auth_headers():
    if AUTH_TOKEN:
        return {"Authorization": f"Bearer {AUTH_TOKEN}"}
    return {}


class PublicEndpointsUser(HttpUser):
    """Simulates unauthenticated users browsing public endpoints."""
    weight = 3
    wait_time = between(1, 3)

    @task(5)
    def health_check(self):
        self.client.get("/health")

    @task(3)
    def list_properties(self):
        self.client.get("/api/v1/properties")

    @task(3)
    def featured_properties(self):
        self.client.get("/api/v1/properties/featured")

    @task(2)
    def list_opportunities(self):
        self.client.get("/api/v1/opportunities")

    @task(1)
    def property_cities(self):
        self.client.get("/api/v1/properties/cities")

    @task(1)
    def site_content(self):
        self.client.get("/api/v1/site-content/landing")

    @task(1)
    def api_docs(self):
        self.client.get("/docs")


class AuthenticatedInvestorUser(HttpUser):
    """Simulates authenticated investor browsing and portfolio actions."""
    weight = 2
    wait_time = between(1, 5)

    @task(4)
    def portfolio_summary(self):
        self.client.get("/api/v1/portfolio/summary", headers=auth_headers())

    @task(3)
    def portfolio_properties(self):
        self.client.get("/api/v1/portfolio/properties", headers=auth_headers())

    @task(3)
    def portfolio_vault_wise(self):
        self.client.get("/api/v1/portfolio/vault-wise", headers=auth_headers())

    @task(2)
    def portfolio_transactions(self):
        self.client.get("/api/v1/portfolio/transactions", headers=auth_headers())

    @task(3)
    def marketplace_browse(self):
        self.client.get("/api/v1/properties", headers=auth_headers())

    @task(2)
    def opportunities_list(self):
        self.client.get("/api/v1/opportunities", headers=auth_headers())

    @task(2)
    def vault_stats(self):
        self.client.get("/api/v1/opportunities/vault-stats", headers=auth_headers())

    @task(1)
    def notifications(self):
        self.client.get("/api/v1/notifications", headers=auth_headers())

    @task(1)
    def unread_count(self):
        self.client.get("/api/v1/notifications/unread-count", headers=auth_headers())

    @task(1)
    def user_activities(self):
        self.client.get("/api/v1/opportunities/user/activities", headers=auth_headers())

    @task(1)
    def profiling_progress(self):
        self.client.get("/api/v1/profiling/overall-progress", headers=auth_headers())


class AdminUser(HttpUser):
    """Simulates admin dashboard usage."""
    weight = 1
    wait_time = between(2, 8)

    @task(3)
    def analytics_dashboard(self):
        self.client.get("/api/v1/analytics/dashboard", headers=auth_headers())

    @task(2)
    def platform_stats(self):
        self.client.get("/api/v1/control-centre/platform-stats", headers=auth_headers())

    @task(2)
    def vault_config(self):
        self.client.get("/api/v1/control-centre/vault-config", headers=auth_headers())

    @task(1)
    def users_list(self):
        self.client.get("/api/v1/control-centre/users", headers=auth_headers())

    @task(1)
    def approvals_list(self):
        self.client.get("/api/v1/approvals", headers=auth_headers())

    @task(1)
    def analytics_revenue(self):
        self.client.get("/api/v1/analytics/revenue", headers=auth_headers())
