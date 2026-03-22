"""
Python serverless function for metrics aggregation.
Reads from deliberacoes_extraidas table in Supabase and returns aggregated stats.
Supports CSV export via ?formato=csv.
"""

import csv
import io
import json
import os
from collections import defaultdict
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

try:
    import httpx
except ImportError:
    httpx = None

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
TABLE = "deliberacoes_extraidas"


def _supabase_key():
    return SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY


def _supabase_headers():
    key = _supabase_key()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _fetch_all_rows() -> list:
    """Fetch all rows needed for aggregation (select only required columns)."""
    if not SUPABASE_URL or not _supabase_key() or httpx is None:
        return []

    url = (
        f"{SUPABASE_URL}/rest/v1/{TABLE}"
        f"?select=agencia,microtema,decisao,data_reuniao,processo,interessado"
        f"&limit=5000&order=data_reuniao.desc"
    )
    try:
        resp = httpx.get(url, headers=_supabase_headers(), timeout=20)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return []


def _aggregate(rows: list) -> dict:
    """Build aggregated metrics from raw rows."""
    por_agencia: dict = defaultdict(int)
    por_decisao: dict = defaultdict(int)
    por_mes: dict = defaultdict(int)
    por_microtema: dict = defaultdict(int)

    for row in rows:
        agencia = row.get("agencia") or "Desconhecida"
        decisao = row.get("decisao") or "Não informada"
        microtema = row.get("microtema") or "Outros"
        data = row.get("data_reuniao") or ""

        por_agencia[agencia] += 1
        por_decisao[decisao] += 1
        por_microtema[microtema] += 1

        if data and len(data) >= 7:
            mes = data[:7]  # "YYYY-MM"
            por_mes[mes] += 1

    # Sort por_mes chronologically
    por_mes_list = sorted(
        [{"mes": k, "total": v} for k, v in por_mes.items()],
        key=lambda x: x["mes"],
    )

    return {
        "total": len(rows),
        "por_agencia": dict(sorted(por_agencia.items(), key=lambda x: x[1], reverse=True)),
        "por_decisao": dict(sorted(por_decisao.items(), key=lambda x: x[1], reverse=True)),
        "por_microtema": dict(sorted(por_microtema.items(), key=lambda x: x[1], reverse=True)[:20]),
        "por_mes": por_mes_list,
    }


def _to_csv(rows: list) -> bytes:
    """Export rows as UTF-8 CSV."""
    output = io.StringIO()
    fields = ["agencia", "microtema", "decisao", "data_reuniao", "processo", "interessado"]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({f: row.get(f, "") for f in fields})
    return output.getvalue().encode("utf-8-sig")  # BOM for Excel compatibility


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # /api/metricas/exportar or ?formato=csv → CSV download
        is_export = "exportar" in parsed.path or params.get("formato", [""])[0] == "csv"

        if not SUPABASE_URL or not _supabase_key():
            self._respond_error(500, "Supabase not configured")
            return

        rows = _fetch_all_rows()

        if not rows and httpx is None:
            self._respond_error(500, "httpx not available")
            return

        if is_export:
            csv_bytes = _to_csv(rows)
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", "attachment; filename=\"deliberacoes.csv\"")
            self.send_header("Content-Length", str(len(csv_bytes)))
            self.end_headers()
            self.wfile.write(csv_bytes)
            return

        result = _aggregate(rows)
        self._respond(200, result)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _respond(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self._cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _respond_error(self, status: int, message: str):
        self._respond(status, {"error": message})

    def log_message(self, format, *args):
        pass
