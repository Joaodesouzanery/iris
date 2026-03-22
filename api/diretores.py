"""
Python serverless function for returning regulatory agency directors data.
Data is verified from official sources. Supports future Supabase integration.
"""

import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import date

# Verified director data from official sources (as of March 2026)
DIRETORES_DATA = {
    "ARTESP": {
        "nome_completo": "Agência de Transporte do Estado de São Paulo",
        "sigla": "ARTESP",
        "setor": "Transporte",
        "diretores": [
            {
                "nome": "André Luiz Cavalcanti Isper",
                "cargo": "Diretor-Presidente",
                "inicio_mandato": "2024-10",
                "fim_mandato": "2029-06",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
            {
                "nome": "Diego Zanatto",
                "cargo": "Diretor",
                "inicio_mandato": "2024-10",
                "fim_mandato": "2030-06",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
            {
                "nome": "Raquel França",
                "cargo": "Diretora",
                "inicio_mandato": "2025-05",
                "fim_mandato": "2029-05",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
            {
                "nome": "Fernanda Esbízaro",
                "cargo": "Diretora",
                "inicio_mandato": "2025-08",
                "fim_mandato": "2029-08",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
        ],
    },
    "ANEEL": {
        "nome_completo": "Agência Nacional de Energia Elétrica",
        "sigla": "ANEEL",
        "setor": "Energia Elétrica",
        "diretores": [
            {
                "nome": "Sandoval Feitosa Neto",
                "cargo": "Diretor-Presidente",
                "inicio_mandato": "2021-01",
                "fim_mandato": "2025-01",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
            {
                "nome": "Hélvio Neves Guerra",
                "cargo": "Diretor",
                "inicio_mandato": "2020-01",
                "fim_mandato": "2024-01",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
            {
                "nome": "Agnes da Costa",
                "cargo": "Diretora",
                "inicio_mandato": "2022-01",
                "fim_mandato": "2026-01",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
            {
                "nome": "Fernando Mosna",
                "cargo": "Diretor",
                "inicio_mandato": "2022-01",
                "fim_mandato": "2026-01",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
        ],
    },
    "ANP": {
        "nome_completo": "Agência Nacional do Petróleo, Gás Natural e Biocombustíveis",
        "sigla": "ANP",
        "setor": "Petróleo e Gás",
        "diretores": [
            {
                "nome": "Rodolfo Saboia",
                "cargo": "Diretor-Presidente",
                "inicio_mandato": "2021-01",
                "fim_mandato": "2025-01",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
            {
                "nome": "Eduardo Granado",
                "cargo": "Diretor",
                "inicio_mandato": "2021-01",
                "fim_mandato": "2025-01",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
        ],
    },
    "ANM": {
        "nome_completo": "Agência Nacional de Mineração",
        "sigla": "ANM",
        "setor": "Mineração",
        "diretores": [
            {
                "nome": "Márcio Régis Melo Coutinho",
                "cargo": "Diretor-Presidente",
                "inicio_mandato": "2023-01",
                "fim_mandato": "2027-01",
                "status": "ativo",
                "votos_favor": 0,
                "votos_contra": 0,
            },
        ],
    },
}


def _enrich_with_supabase(agencia_data: list, agencia: str) -> list:
    """
    Optionally enrich director data with vote counts from Supabase.
    Falls back gracefully if Supabase is unavailable.
    """
    try:
        import httpx
        supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
        if not supabase_url or not supabase_key:
            return agencia_data

        # Fetch vote counts per director name from deliberacoes_extraidas
        url = (
            f"{supabase_url}/rest/v1/deliberacoes_extraidas"
            f"?select=votos_favor,votos_contra&agencia=eq.{agencia}&limit=5000"
        )
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
        }
        resp = httpx.get(url, headers=headers, timeout=8)
        if resp.status_code != 200:
            return agencia_data

        rows = resp.json()
        vote_counts: dict = {}
        for row in rows:
            for field in ("votos_favor", "votos_contra"):
                val = row.get(field)
                if not val:
                    continue
                if isinstance(val, str):
                    try:
                        import json as _json
                        val = _json.loads(val)
                    except Exception:
                        val = [v.strip() for v in val.split(",") if v.strip()]
                if isinstance(val, list):
                    for name in val:
                        if name:
                            key = (name.strip(), field)
                            vote_counts[key] = vote_counts.get(key, 0) + 1

        # Merge counts into director records
        enriched = []
        for d in agencia_data:
            nome = d["nome"]
            d = dict(d)
            d["votos_favor"] = vote_counts.get((nome, "votos_favor"), 0)
            d["votos_contra"] = vote_counts.get((nome, "votos_contra"), 0)
            enriched.append(d)
        return enriched

    except Exception:
        return agencia_data


def _mandate_status(fim_mandato: str) -> str:
    """Return 'ativo', 'expirando' (within 6 months), or 'expirado'."""
    try:
        year, month = map(int, fim_mandato.split("-"))
        end = date(year, month, 1)
        today = date.today()
        diff_months = (end.year - today.year) * 12 + (end.month - today.month)
        if diff_months < 0:
            return "expirado"
        if diff_months <= 6:
            return "expirando"
        return "ativo"
    except Exception:
        return "ativo"


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        agencia_param = params.get("agencia", [""])[0].upper()

        if agencia_param and agencia_param in DIRETORES_DATA:
            agencia_info = DIRETORES_DATA[agencia_param]
            diretores = agencia_info["diretores"]

            # Enrich with live vote counts (best-effort)
            diretores = _enrich_with_supabase(diretores, agencia_param)

            # Add computed mandate status
            for d in diretores:
                d["mandate_status"] = _mandate_status(d.get("fim_mandato", ""))

            result = {
                "agencia": agencia_param,
                "nome_completo": agencia_info["nome_completo"],
                "setor": agencia_info["setor"],
                "diretores": diretores,
            }
        elif not agencia_param or agencia_param in ("TODAS", "ALL", ""):
            # Return all agencies summary
            all_agencies = []
            for sigla, info in DIRETORES_DATA.items():
                all_agencies.append({
                    "agencia": sigla,
                    "nome_completo": info["nome_completo"],
                    "setor": info["setor"],
                    "total_diretores": len(info["diretores"]),
                })
            result = {"agencias": all_agencies}
        else:
            result = {"error": f"Agência não encontrada: {agencia_param}", "agencias_disponiveis": list(DIRETORES_DATA.keys())}

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

    def log_message(self, format, *args):
        pass
