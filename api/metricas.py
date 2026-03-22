"""
Python serverless function for metrics aggregation.
Reads from deliberacoes_extraidas table in Supabase.

Routes via query param ?tipo=:
  (default)         → main aggregated stats
  tipo=por-diretor  → vote counts per director
  tipo=diretor-detalhe&nome=X → individual director metrics
  tipo=institucional → meeting/institutional stats
  formato=csv       → CSV export of all rows
"""

import csv
import io
import json
import os
from collections import defaultdict
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote_plus

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


def _fetch_rows(agencia: str = "", select: str = None) -> list:
    """Fetch rows from Supabase. Optionally filter by agencia."""
    if not SUPABASE_URL or not _supabase_key() or httpx is None:
        return []

    cols = select or "agencia,microtema,decisao,data_reuniao,processo,interessado,pauta_interna,votos_favor,votos_contra,numero_reuniao"
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?select={cols}&limit=5000&order=data_reuniao.desc"
    if agencia and agencia.upper() not in ("TODAS", "ALL", ""):
        url += f"&agencia=eq.{agencia.upper()}"
    try:
        resp = httpx.get(url, headers=_supabase_headers(), timeout=20)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return []


def _parse_votos(val) -> list:
    if not val:
        return []
    if isinstance(val, list):
        return val
    try:
        parsed = json.loads(val)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except Exception:
        return [v.strip() for v in str(val).split(",") if v.strip()]


# ── Main aggregation ──────────────────────────────────────────────────────────

def fetch_main(agencia: str = "") -> dict:
    rows = _fetch_rows(agencia, select="agencia,microtema,decisao,data_reuniao,pauta_interna")
    if not rows:
        return {"total": 0, "por_agencia": {}, "por_decisao": {}, "por_microtema": {}, "por_mes": []}

    por_agencia: dict = defaultdict(int)
    por_decisao: dict = defaultdict(int)
    por_mes: dict = defaultdict(int)
    por_microtema: dict = defaultdict(int)

    for row in rows:
        por_agencia[row.get("agencia") or "Desconhecida"] += 1
        por_decisao[row.get("decisao") or "Não informada"] += 1
        por_microtema[row.get("microtema") or "Outros"] += 1
        data = row.get("data_reuniao") or ""
        if data and len(data) >= 7:
            por_mes[data[:7]] += 1

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


# ── Por diretor ───────────────────────────────────────────────────────────────

def fetch_por_diretor(agencia: str = "") -> dict:
    rows = _fetch_rows(agencia, select="votos_favor,votos_contra,pauta_interna,decisao,microtema")
    favoravel: dict = defaultdict(int)
    contra: dict = defaultdict(int)

    for row in rows:
        for nome in _parse_votos(row.get("votos_favor")):
            nome = nome.strip()
            if nome:
                favoravel[nome] += 1
        for nome in _parse_votos(row.get("votos_contra")):
            nome = nome.strip()
            if nome:
                contra[nome] += 1

    all_names = set(list(favoravel.keys()) + list(contra.keys()))
    diretores = []
    for nome in sorted(all_names):
        fav = favoravel.get(nome, 0)
        con = contra.get(nome, 0)
        total = fav + con
        taxa = round(fav / total * 100, 1) if total > 0 else 0.0
        diretores.append({
            "nome": nome,
            "total": total,
            "favoravel": fav,
            "contra": con,
            "taxa": taxa,
        })

    diretores.sort(key=lambda x: x["total"], reverse=True)
    return {"diretores": diretores[:20], "agencia": agencia or "TODAS"}


# ── Diretor detalhe ───────────────────────────────────────────────────────────

def fetch_diretor_detalhe(nome: str, agencia: str = "") -> dict:
    rows = _fetch_rows(agencia, select="votos_favor,votos_contra,pauta_interna,decisao,microtema,data_reuniao")
    nome_lower = nome.lower().strip()

    total_votos = 0
    externos = 0
    deferidos = 0
    votos_contra_count = 0
    por_tema: dict = defaultdict(int)
    por_mes: dict = defaultdict(int)
    # Track majority decision per row to detect divergence
    divergentes = 0

    for row in rows:
        fav = [n.strip().lower() for n in _parse_votos(row.get("votos_favor"))]
        con = [n.strip().lower() for n in _parse_votos(row.get("votos_contra"))]
        in_fav = nome_lower in fav
        in_con = nome_lower in con
        if not (in_fav or in_con):
            continue

        total_votos += 1
        tema = row.get("microtema") or "Outros"
        por_tema[tema] += 1
        data = row.get("data_reuniao") or ""
        if data and len(data) >= 7:
            por_mes[data[:7]] += 1

        if not row.get("pauta_interna"):
            externos += 1
        decisao = (row.get("decisao") or "").upper()
        if "DEFERIDO" in decisao and "INDEFERIDO" not in decisao:
            deferidos += 1
        if in_con:
            votos_contra_count += 1
        # Divergent = voted against when majority voted in favor (and vice versa)
        majority_fav = len(fav) > len(con)
        if (in_con and majority_fav) or (in_fav and not majority_fav and len(con) > 0):
            divergentes += 1

    externos_pct = round(externos / total_votos * 100, 1) if total_votos else 0.0
    taxa_deferimento = round(deferidos / total_votos * 100, 1) if total_votos else 0.0

    top_temas = sorted(
        [{"tema": k, "total": v} for k, v in por_tema.items()],
        key=lambda x: x["total"], reverse=True
    )[:5]

    por_mes_list = sorted(
        [{"mes": k, "total": v} for k, v in por_mes.items()],
        key=lambda x: x["mes"]
    )

    return {
        "nome": nome,
        "total_votos": total_votos,
        "externos_pct": externos_pct,
        "taxa_deferimento": taxa_deferimento,
        "votos_divergentes": divergentes,
        "top_temas": top_temas,
        "por_mes": por_mes_list,
    }


# ── Institucional ─────────────────────────────────────────────────────────────

def fetch_institucional(agencia: str = "") -> dict:
    rows = _fetch_rows(agencia, select="data_reuniao,pauta_interna,numero_reuniao,decisao")
    if not rows:
        return {
            "total_reunioes": 0, "total_deliberacoes": 0,
            "intervalo_medio_dias": 0, "pct_interna": 0,
            "reunioes_por_ano": {}, "pauta": {"interna": 0, "externa": 0}
        }

    total_deliberacoes = len(rows)
    reunioes: set = set()
    for row in rows:
        nr = row.get("numero_reuniao") or ""
        data = row.get("data_reuniao") or ""
        if nr and data:
            reunioes.add(f"{nr}|{data[:10]}")
        elif data:
            reunioes.add(data[:10])

    # Dates for interval calculation
    dates = []
    for row in rows:
        data = row.get("data_reuniao") or ""
        if data and len(data) >= 10:
            try:
                dates.append(datetime.strptime(data[:10], "%Y-%m-%d"))
            except ValueError:
                pass
    dates.sort()
    intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1) if dates[i+1] != dates[i]]
    intervalo_medio = round(sum(intervals) / len(intervals), 1) if intervals else 0.0

    interna = sum(1 for r in rows if r.get("pauta_interna"))
    externa = total_deliberacoes - interna
    pct_interna = round(interna / total_deliberacoes * 100) if total_deliberacoes else 0

    reunioes_por_ano: dict = defaultdict(set)
    for row in rows:
        data = row.get("data_reuniao") or ""
        nr = row.get("numero_reuniao") or ""
        if data and len(data) >= 4:
            year = data[:4]
            reunioes_por_ano[year].add(nr or data[:10])

    return {
        "total_reunioes": len(reunioes),
        "total_deliberacoes": total_deliberacoes,
        "intervalo_medio_dias": intervalo_medio,
        "pct_interna": pct_interna,
        "reunioes_por_ano": {k: len(v) for k, v in sorted(reunioes_por_ano.items())},
        "pauta": {"interna": interna, "externa": externa},
    }


# ── CSV export ────────────────────────────────────────────────────────────────

def _to_csv(agencia: str = "") -> bytes:
    rows = _fetch_rows(agencia, select="agencia,microtema,decisao,data_reuniao,processo,interessado,numero_reuniao,pauta_interna")
    output = io.StringIO()
    fields = ["agencia", "microtema", "decisao", "data_reuniao", "processo", "interessado", "numero_reuniao", "pauta_interna"]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({f: row.get(f, "") for f in fields})
    return output.getvalue().encode("utf-8-sig")  # BOM for Excel


# ── HTTP Handler ──────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        agencia = params.get("agencia", [""])[0]
        tipo = params.get("tipo", [""])[0]
        formato = params.get("formato", [""])[0]
        nome = unquote_plus(params.get("nome", [""])[0])

        if not SUPABASE_URL or not _supabase_key():
            self._respond(500, {"error": "Supabase not configured"})
            return

        # CSV export
        if formato == "csv" or tipo == "exportar":
            csv_bytes = _to_csv(agencia)
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="deliberacoes.csv"')
            self.send_header("Content-Length", str(len(csv_bytes)))
            self.end_headers()
            self.wfile.write(csv_bytes)
            return

        # Route by tipo
        if tipo == "por-diretor":
            result = fetch_por_diretor(agencia)
        elif tipo == "diretor-detalhe":
            if not nome:
                self._respond(400, {"error": "nome param required"})
                return
            result = fetch_diretor_detalhe(nome, agencia)
        elif tipo == "institucional":
            result = fetch_institucional(agencia)
        elif tipo == "ping":
            result = {"status": "ok", "supabase": bool(SUPABASE_URL and _supabase_key())}
        else:
            result = fetch_main(agencia)

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
