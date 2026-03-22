"""
Python serverless function for reading deliberations from Supabase.
Supports filtering, pagination, and search.
"""

import json
import os
import re
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
DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def _supabase_key():
    return SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY


def _supabase_headers():
    key = _supabase_key()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _parse_votos(val):
    """Parse votos field — stored as JSON string or plain text."""
    if not val:
        return []
    if isinstance(val, list):
        return val
    try:
        parsed = json.loads(val)
        if isinstance(parsed, list):
            return parsed
        return [str(parsed)]
    except Exception:
        # Fallback: split by comma if it looks like a list
        if "," in str(val):
            return [v.strip() for v in str(val).split(",") if v.strip()]
        return [str(val)] if val else []


def fetch_deliberacoes(params: dict) -> dict:
    """Fetch deliberations from Supabase with filters."""
    if not SUPABASE_URL or not _supabase_key():
        return {"error": "Supabase not configured", "deliberacoes": [], "total": 0}

    if httpx is None:
        return {"error": "httpx not available", "deliberacoes": [], "total": 0}

    page = max(1, int(params.get("page", [1])[0]))
    limit = min(MAX_LIMIT, max(1, int(params.get("limit", [DEFAULT_LIMIT])[0])))
    offset = (page - 1) * limit

    # Build Supabase REST query filters
    filters = []

    agencia = params.get("agencia", [""])[0]
    if agencia and agencia.lower() not in ("todas", "all", ""):
        filters.append(f"agencia=eq.{agencia}")

    microtema = params.get("microtema", [""])[0]
    if microtema and microtema.lower() not in ("todos", "all", ""):
        filters.append(f"microtema=ilike.*{microtema}*")

    decisao = params.get("decisao", [""])[0]
    if decisao and decisao.lower() not in ("todas", "all", ""):
        filters.append(f"decisao=ilike.*{decisao}*")

    ano = params.get("ano", [""])[0]
    if ano and ano.isdigit():
        filters.append(f"data_reuniao=gte.{ano}-01-01")
        filters.append(f"data_reuniao=lte.{ano}-12-31")

    data_inicio = params.get("data_inicio", [""])[0]
    if data_inicio:
        filters.append(f"data_reuniao=gte.{data_inicio}")

    data_fim = params.get("data_fim", [""])[0]
    if data_fim:
        filters.append(f"data_reuniao=lte.{data_fim}")

    pauta_externa = params.get("pauta_externa", [""])[0]
    if pauta_externa == "true":
        filters.append("pauta_interna=is.false")

    # Build search (applied to multiple columns via OR)
    busca = params.get("busca", [""])[0].strip()

    # Build URL
    base = f"{SUPABASE_URL}/rest/v1/{TABLE}"
    select = "id,agencia,numero_reuniao,data_reuniao,processo,interessado,microtema,decisao,resumo_pleito,fundamento_decisao,votos_favor,votos_contra,pauta_interna,link_pdf,created_at"

    query_parts = [f"select={select}", f"offset={offset}", f"limit={limit}", "order=data_reuniao.desc,created_at.desc"]

    if busca:
        # Supabase OR filter across columns
        encoded_busca = busca.replace(" ", "%20")
        or_filter = f"or=(processo.ilike.*{encoded_busca}*,interessado.ilike.*{encoded_busca}*,resumo_pleito.ilike.*{encoded_busca}*,numero_reuniao.ilike.*{encoded_busca}*)"
        query_parts.append(or_filter)

    query_parts.extend(filters)
    url = base + "?" + "&".join(query_parts)

    headers = _supabase_headers()
    headers["Prefer"] = "count=exact"

    try:
        resp = httpx.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        rows = resp.json()

        # Parse Content-Range for total count
        total = len(rows)
        content_range = resp.headers.get("Content-Range", "")
        if content_range and "/" in content_range:
            try:
                total = int(content_range.split("/")[-1])
            except (ValueError, IndexError):
                pass

        # Normalize rows
        deliberacoes = []
        for row in rows:
            deliberacoes.append({
                "id": row.get("id"),
                "agencia": row.get("agencia") or "ARTESP",
                "numero_reuniao": row.get("numero_reuniao"),
                "data_reuniao": row.get("data_reuniao"),
                "processo": row.get("processo"),
                "interessado": row.get("interessado"),
                "microtema": row.get("microtema"),
                "decisao": row.get("decisao"),
                "resumo_pleito": row.get("resumo_pleito"),
                "fundamento_decisao": row.get("fundamento_decisao"),
                "votos_favor": _parse_votos(row.get("votos_favor")),
                "votos_contra": _parse_votos(row.get("votos_contra")),
                "pauta_interna": bool(row.get("pauta_interna")),
                "link_pdf": row.get("link_pdf"),
                "created_at": row.get("created_at"),
            })

        return {
            "deliberacoes": deliberacoes,
            "total": total,
            "page": page,
            "limit": limit,
        }

    except Exception as e:
        return {"error": f"Supabase query failed: {str(e)}", "deliberacoes": [], "total": 0}


def fetch_stats() -> dict:
    """Fetch aggregate stats: distinct agencias, microtemas, anos."""
    if not SUPABASE_URL or not _supabase_key() or httpx is None:
        return {}
    try:
        url = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=agencia,microtema,data_reuniao,decisao&limit=5000"
        resp = httpx.get(url, headers=_supabase_headers(), timeout=10)
        rows = resp.json() if resp.status_code == 200 else []
        agencias = sorted(set(r["agencia"] for r in rows if r.get("agencia")))
        microtemas = sorted(set(r["microtema"] for r in rows if r.get("microtema")))
        anos = sorted(set(
            r["data_reuniao"][:4] for r in rows
            if r.get("data_reuniao") and len(r["data_reuniao"]) >= 4
        ), reverse=True)
        decisoes = sorted(set(r["decisao"] for r in rows if r.get("decisao")))
        return {"agencias": agencias, "microtemas": microtemas, "anos": anos, "decisoes": decisoes}
    except Exception:
        return {}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # /api/deliberacoes?stats=true → return filter options
        if params.get("stats", [""])[0] == "true":
            result = fetch_stats()
            self._respond(200, result)
            return

        result = fetch_deliberacoes(params)
        status = 200 if "error" not in result else 500
        self._respond(status, result)

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

    def log_message(self, format, *args):
        pass
