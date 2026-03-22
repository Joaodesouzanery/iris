"""
Admin endpoint for deleting test data from Supabase.
DELETE /api/admin?agencia=ARTESP  → deletes records for that agency
DELETE /api/admin                  → deletes ALL records
"""
import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs


class handler(BaseHTTPRequestHandler):
    def do_DELETE(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        agencia = params.get("agencia", [""])[0].upper().strip()

        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
        supabase_key = (
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
        )

        if not supabase_url or not supabase_key:
            return self._respond(503, {"error": "Supabase não configurado"})

        try:
            import httpx

            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            }

            if agencia:
                url = f"{supabase_url}/rest/v1/deliberacoes_extraidas?agencia=eq.{agencia}"
            else:
                # Delete all — filter by id >= 0 to avoid "no filter" rejection
                url = f"{supabase_url}/rest/v1/deliberacoes_extraidas?id=gte.0"

            resp = httpx.delete(url, headers=headers, timeout=20)
            deleted = len(resp.json()) if resp.status_code == 200 else 0
            self._respond(200, {"deleted": deleted, "agencia": agencia or "ALL"})

        except Exception as e:
            self._respond(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "DELETE, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )

    def _respond(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
