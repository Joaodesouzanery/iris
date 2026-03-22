"""
Python serverless function for PDF analysis on Vercel.
Receives base64-encoded PDF, extracts text with pdfplumber,
calls Gemini 2.0 Flash (when available), and saves results to Supabase.
Falls back to regex extraction when Gemini is unavailable.
"""

import json
import base64
import os
import io
import re
from http.server import BaseHTTPRequestHandler
from datetime import datetime

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from supabase import create_client
except ImportError:
    create_client = None


GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

EXTRACTION_PROMPT = """Você é um especialista em análise de documentos regulatórios brasileiros.
Analise o texto abaixo de uma ata/deliberação regulatória e extraia TODAS as deliberações encontradas.

Para cada deliberação, extraia os campos em JSON:
- numero_reuniao: número da reunião (ex: "1234")
- data_reuniao: data no formato YYYY-MM-DD (ex: "2025-03-15")
- processo: número do processo administrativo (ex: "ARTESP-DBR-00001/2025")
- interessado: nome da empresa ou pessoa interessada
- agencia: sigla da agência reguladora (ex: "ARTESP", "ANATEL", "ANM", "ANEEL")
- microtema: tema específico da deliberação (ex: "Reajuste Tarifário", "Autorização de Serviço", "Penalidade")
- decisao: resultado da votação ("DEFERIDO", "INDEFERIDO", "PARCIALMENTE DEFERIDO", "APROVADO", "ARQUIVADO", "EM DILIGÊNCIA")
- votos_favor: lista de nomes dos diretores que votaram a favor (array de strings)
- votos_contra: lista de nomes dos diretores que votaram contra (array de strings)
- pauta_interna: true se for ato interno da agência, false se for pleito de terceiros
- resumo_pleito: resumo em 2-3 frases do que está sendo solicitado/decidido
- fundamento_decisao: base legal ou técnica da decisão (ex: "Art. 10 da Lei 10.871/2001")

Retorne um JSON válido com a estrutura:
{
  "deliberacoes": [
    { ... todos os campos acima ... },
    ...
  ]
}

Se um campo não for encontrado, use null. Não invente informações.

TEXTO DA ATA/DELIBERAÇÃO:
"""

# Microtema keyword map for regex fallback
MICROTEMA_KEYWORDS = {
    "tarifa": "Tarifário",
    "reajuste": "Tarifário",
    "pedágio": "Tarifário",
    "obra": "Obras",
    "construção": "Obras",
    "manutenção": "Obras",
    "multa": "Penalidade",
    "penalidade": "Penalidade",
    "sanção": "Penalidade",
    "infração": "Penalidade",
    "contrato": "Contratual",
    "concessão": "Contratual",
    "reequilíbrio": "Reequilíbrio",
    "equilíbrio econômico": "Reequilíbrio",
    "fiscalização": "Fiscalização",
    "vistoria": "Fiscalização",
    "inspeção": "Fiscalização",
    "segurança": "Segurança",
    "acidente": "Segurança",
    "ambiental": "Ambiental",
    "meio ambiente": "Ambiental",
    "desapropriação": "Desapropriação",
    "usuário": "Usuário",
    "reclamação": "Usuário",
    "gratuidade": "Gratuidade",
    "passe livre": "Gratuidade",
    "autorização": "Autorização",
    "licença": "Autorização",
    "norma": "Normativo",
    "resolução": "Normativo",
    "regulamento": "Normativo",
}


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    if pdfplumber is None:
        raise RuntimeError("pdfplumber not available")

    text_parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text(x_tolerance=3, y_tolerance=3)
            if page_text:
                text_parts.append(page_text)

    return "\n\n".join(text_parts)


def call_gemini(text: str) -> dict:
    """Call Gemini 2.0 Flash to extract structured deliberations."""
    if genai is None:
        raise RuntimeError("google-generativeai not available")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    # Limit text to avoid token limits (~100k chars)
    truncated = text[:100000] if len(text) > 100000 else text

    response = model.generate_content(
        EXTRACTION_PROMPT + truncated,
        generation_config={
            "temperature": 0.1,
            "response_mime_type": "application/json",
        },
        request_options={"timeout": 50},
    )

    raw = response.text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    return json.loads(raw)


def extract_with_regex(text: str, agencia: str = "ARTESP") -> dict:
    """
    Regex-based fallback extraction for Brazilian regulatory deliberation PDFs.
    Covers the most common ARTESP / agency document formats.
    Returns a single deliberation dict (one per document assumed).
    """
    t = text

    # --- numero_reuniao ---
    numero_reuniao = None
    m = re.search(
        r"reuni[aã]o\s+(?:ordin[aá]ria|extraordin[aá]ria)?\s*n[°º\.o]?\s*([\d\.]+)",
        t, re.IGNORECASE
    )
    if not m:
        m = re.search(r"delibera[çc][aã]o\s+n[°º\.o]?\s*([\d\.]+)", t, re.IGNORECASE)
    if m:
        numero_reuniao = m.group(1).strip().lstrip("0") or m.group(1).strip()

    # --- data_reuniao ---
    data_reuniao = None
    m = re.search(r"\b(\d{2})\s*/\s*(\d{2})\s*/\s*(\d{4})\b", t)
    if not m:
        # Written form: "15 de março de 2025"
        months = {
            "janeiro": "01", "fevereiro": "02", "março": "03", "abril": "04",
            "maio": "05", "junho": "06", "julho": "07", "agosto": "08",
            "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12",
        }
        m2 = re.search(
            r"\b(\d{1,2})\s+de\s+(" + "|".join(months.keys()) + r")\s+de\s+(\d{4})\b",
            t, re.IGNORECASE
        )
        if m2:
            day, month_name, year = m2.group(1), m2.group(2).lower(), m2.group(3)
            data_reuniao = f"{year}-{months[month_name]}-{day.zfill(2)}"
    else:
        data_reuniao = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    # --- processo ---
    processo = None
    m = re.search(
        r"((?:SEI[!]?\s*n[°º\.o]\s*[\d\.]+/\d{4}[-–]\d+)"
        r"|(?:[A-Z]{2,10}[-–][A-Z0-9]+[-/]\d{4}[-/]\d+)"
        r"|(?:\d{3,}\.\d{5}/\d{4}[-–]\d+))",
        t, re.IGNORECASE
    )
    if m:
        processo = m.group(1).strip()

    # --- interessado ---
    interessado = None
    m = re.search(
        r"(?:interessad[oa]|requerente|empresa|operador[a]?)\s*[:\-–]\s*(.+?)(?:\n|$)",
        t, re.IGNORECASE
    )
    if m:
        interessado = re.sub(r"\s+", " ", m.group(1)).strip()[:200]

    # --- decisao ---
    decisao = None
    decisao_map = [
        (r"\bparcialmente\s+deferido\b", "PARCIALMENTE DEFERIDO"),
        (r"\bindeferido\b", "INDEFERIDO"),
        (r"\bdeferido\b", "DEFERIDO"),
        (r"\bem\s+dilig[êe]ncia\b", "EM DILIGÊNCIA"),
        (r"\barquivado\b", "ARQUIVADO"),
        (r"\baprovado\b", "APROVADO"),
    ]
    for pattern, label in decisao_map:
        if re.search(pattern, t, re.IGNORECASE):
            decisao = label
            break

    # --- votos_favor ---
    votos_favor = []
    m = re.search(
        r"(?:votaram?\s+a\s+favor|voto\s+favor[aá]vel|votos?\s+favor[aá]ve[il]s?)\s*[:\-–]\s*(.+?)(?:\n\n|\n(?=[A-Z])|$)",
        t, re.IGNORECASE | re.DOTALL
    )
    if m:
        names_raw = m.group(1).strip()
        # Split by comma or semicolon or "e" between names
        names = re.split(r"[,;]\s*|\s+e\s+", names_raw)
        votos_favor = [n.strip() for n in names if len(n.strip()) > 3][:10]

    # --- votos_contra ---
    votos_contra = []
    m = re.search(
        r"(?:votaram?\s+contra|voto\s+contr[aá]rio|votos?\s+contr[aá]rios?)\s*[:\-–]\s*(.+?)(?:\n\n|\n(?=[A-Z])|$)",
        t, re.IGNORECASE | re.DOTALL
    )
    if m:
        names_raw = m.group(1).strip()
        names = re.split(r"[,;]\s*|\s+e\s+", names_raw)
        votos_contra = [n.strip() for n in names if len(n.strip()) > 3][:10]

    # --- pauta_interna ---
    pauta_interna = bool(re.search(r"pauta\s+interna|ato\s+(interno|administrativo\s+interno)", t, re.IGNORECASE))
    if interessado and re.search(r"\b(S[./]A|LTDA|EIRELI|ME|EPP|S\.A\.|Ltda)\b", interessado or "", re.IGNORECASE):
        pauta_interna = False

    # --- microtema ---
    microtema = "Outros"
    t_lower = t.lower()
    for keyword, tema in MICROTEMA_KEYWORDS.items():
        if keyword in t_lower:
            microtema = tema
            break

    # --- resumo_pleito: first substantial paragraph ---
    resumo_pleito = None
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", t) if len(p.strip()) > 80]
    # Skip header paragraphs (short lines, lots of caps, page numbers)
    for para in paragraphs[2:8]:
        if not re.match(r"^[\d\s\-\.]+$", para) and len(para) > 100:
            resumo_pleito = re.sub(r"\s+", " ", para)[:500]
            break

    # --- fundamento_decisao: sentence with legal citations ---
    fundamento_decisao = None
    m = re.search(
        r"((?:Art\.|Artigo|Lei|Decreto|Resolução|Portaria)[^\n]{20,200})",
        t, re.IGNORECASE
    )
    if m:
        fundamento_decisao = re.sub(r"\s+", " ", m.group(1)).strip()[:400]

    return {
        "numero_reuniao": numero_reuniao,
        "data_reuniao": data_reuniao,
        "processo": processo,
        "interessado": interessado,
        "agencia": agencia,
        "microtema": microtema,
        "decisao": decisao,
        "votos_favor": votos_favor,
        "votos_contra": votos_contra,
        "pauta_interna": pauta_interna,
        "resumo_pleito": resumo_pleito,
        "fundamento_decisao": fundamento_decisao,
    }


def save_to_supabase(deliberacoes: list, filename: str) -> int:
    """Save extracted deliberations to Supabase. Returns count saved."""
    if create_client is None or not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return 0

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    saved = 0

    for delib in deliberacoes:
        row = {
            "agencia": delib.get("agencia") or "ARTESP",
            "processo": delib.get("processo"),
            "numero_reuniao": delib.get("numero_reuniao"),
            "data_reuniao": delib.get("data_reuniao"),
            "interessado": delib.get("interessado"),
            "pauta_interna": bool(delib.get("pauta_interna")),
            "microtema": delib.get("microtema"),
            "decisao": delib.get("decisao"),
            "resumo_pleito": delib.get("resumo_pleito"),
            "fundamento_decisao": delib.get("fundamento_decisao"),
            # FIX: correct column names matching the DB schema
            "votos_favor": json.dumps(delib.get("votos_favor") or []),
            "votos_contra": json.dumps(delib.get("votos_contra") or []),
            "link_pdf": filename,
            "raw_data": json.dumps(delib),
        }
        # Remove None values to let DB defaults apply
        row = {k: v for k, v in row.items() if v is not None}

        try:
            result = (
                client.table("deliberacoes_extraidas")
                .upsert(row, on_conflict="processo,numero_reuniao", ignore_duplicates=True)
                .execute()
            )
            if result.data:
                saved += 1
        except Exception:
            # Try insert without upsert if conflict columns are missing
            try:
                result = (
                    client.table("deliberacoes_extraidas")
                    .insert(row)
                    .execute()
                )
                if result.data:
                    saved += 1
            except Exception:
                pass

    return saved


def handle_request(body: dict) -> dict:
    """Core logic: decode PDF, extract text, call Gemini (or regex), save to Supabase."""
    pdf_b64 = body.get("pdf_base64") or body.get("pdf")
    filename = body.get("filename") or body.get("nome") or "upload.pdf"
    agencia = body.get("agencia") or "ARTESP"

    if not pdf_b64:
        return {"error": "pdf_base64 is required", "step": "input_validation", "deliberacoes": []}

    # Decode base64
    try:
        pdf_bytes = base64.b64decode(pdf_b64)
    except Exception as e:
        return {"error": f"Invalid base64: {str(e)}", "step": "decode", "deliberacoes": []}

    # Check if this PDF was already processed (dedup by filename)
    if create_client and SUPABASE_URL and SUPABASE_SERVICE_KEY:
        try:
            _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
            existing = (
                _client.table("deliberacoes_extraidas")
                .select("id")
                .eq("link_pdf", filename)
                .limit(1)
                .execute()
            )
            if existing.data:
                return {
                    "deliberacoes": [],
                    "total": 0,
                    "saved": 0,
                    "skipped": True,
                    "reason": f"PDF '{filename}' já foi processado anteriormente",
                }
        except Exception:
            pass  # If check fails, proceed with analysis

    # Extract text
    try:
        text = extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        return {
            "error": f"PDF extraction failed: {str(e)}",
            "step": "text_extraction",
            "hint": "pdfplumber may not be installed or the PDF is encrypted/image-based",
            "deliberacoes": [],
        }

    if not text.strip():
        return {
            "error": "No text extracted from PDF",
            "step": "text_extraction",
            "hint": "The PDF may be image-based (scanned). Only text-layer PDFs are supported.",
            "deliberacoes": [],
        }

    # Try Gemini, fall back to regex
    extraction_method = "unknown"
    gemini_error = None
    try:
        result = call_gemini(text)
        extraction_method = "gemini"
    except Exception as e:
        gemini_error = str(e)
        # Regex fallback — attempt to extract multiple deliberations if possible
        # by splitting on common section markers
        deliberation_sections = re.split(
            r"(?=(?:delibera[çc][aã]o|item\s+\d+|pauta\s+\d+)[\s\n]+)",
            text, flags=re.IGNORECASE
        )
        if len(deliberation_sections) <= 1:
            deliberation_sections = [text]

        deliberacoes_regex = []
        for section in deliberation_sections[:30]:  # limit to 30 sections
            if len(section.strip()) < 100:
                continue
            d = extract_with_regex(section.strip(), agencia)
            if d.get("numero_reuniao") or d.get("processo") or d.get("decisao"):
                deliberacoes_regex.append(d)

        result = {"deliberacoes": deliberacoes_regex}
        extraction_method = "regex"

    deliberacoes = result.get("deliberacoes", [])

    # Override agency if provided
    for d in deliberacoes:
        if not d.get("agencia"):
            d["agencia"] = agencia

    # Save to Supabase
    saved = 0
    save_error = None
    try:
        saved = save_to_supabase(deliberacoes, filename)
    except Exception as e:
        save_error = str(e)

    response = {
        "deliberacoes": deliberacoes,
        "total": len(deliberacoes),
        "saved": saved,
        "extraction_method": extraction_method,
        "text_length": len(text),
    }

    if gemini_error:
        response["gemini_error"] = gemini_error
        response["step"] = "ai_analysis_fallback"

    if save_error:
        response["save_error"] = save_error
        response["step"] = "db_save_failed"

    return response


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length)
            body = json.loads(raw_body)
        except Exception as e:
            self._respond(400, {"error": f"Invalid JSON body: {str(e)}"})
            return

        result = handle_request(body)
        # Return 200 even on partial success (extraction_method present = some result)
        status = 200 if ("error" not in result or "deliberacoes" in result) else 422
        self._respond(status, result)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        self._respond(200, {
            "status": "ok",
            "service": "iris-pdf-analyzer",
            "gemini_configured": bool(GEMINI_API_KEY),
            "supabase_configured": bool(SUPABASE_URL and SUPABASE_SERVICE_KEY),
            "dependencies": {
                "pdfplumber": pdfplumber is not None,
                "gemini": genai is not None,
                "supabase": create_client is not None,
            },
        })

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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
        pass  # Suppress default access log noise in Vercel
