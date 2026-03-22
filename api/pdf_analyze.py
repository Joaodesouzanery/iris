"""
Python serverless function for PDF analysis on Vercel.
Receives base64-encoded PDF, extracts text with pdfplumber,
calls Gemini 2.0 Flash, and saves results to Supabase.
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
    )

    raw = response.text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)

    return json.loads(raw)


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
            "votos_favoraveis": json.dumps(delib.get("votos_favor") or []),
            "votos_contrarios": json.dumps(delib.get("votos_contra") or []),
            "link_pdf": filename,
            "raw_data": json.dumps(delib),
        }
        # Remove None values to let DB defaults apply
        row = {k: v for k, v in row.items() if v is not None}

        result = client.table("deliberacoes_extraidas").insert(row).execute()
        if result.data:
            saved += 1

    return saved


def handle_request(body: dict) -> dict:
    """Core logic: decode PDF, extract text, call Gemini, save to Supabase."""
    pdf_b64 = body.get("pdf_base64") or body.get("pdf")
    filename = body.get("filename") or body.get("nome") or "upload.pdf"
    agencia = body.get("agencia") or "ARTESP"

    if not pdf_b64:
        return {"error": "pdf_base64 is required", "deliberacoes": []}

    # Decode base64
    try:
        pdf_bytes = base64.b64decode(pdf_b64)
    except Exception as e:
        return {"error": f"Invalid base64: {str(e)}", "deliberacoes": []}

    # Extract text
    try:
        text = extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        return {"error": f"PDF extraction failed: {str(e)}", "deliberacoes": []}

    if not text.strip():
        return {"error": "No text extracted from PDF", "deliberacoes": []}

    # Call Gemini
    try:
        result = call_gemini(text)
    except Exception as e:
        return {"error": f"Gemini failed: {str(e)}", "deliberacoes": [], "text_length": len(text)}

    deliberacoes = result.get("deliberacoes", [])

    # Override agency if provided
    for d in deliberacoes:
        if not d.get("agencia"):
            d["agencia"] = agencia

    # Save to Supabase
    saved = 0
    try:
        saved = save_to_supabase(deliberacoes, filename)
    except Exception as e:
        # Non-fatal — still return extracted data
        return {
            "deliberacoes": deliberacoes,
            "total": len(deliberacoes),
            "saved": saved,
            "warning": f"Supabase save error: {str(e)}",
        }

    return {
        "deliberacoes": deliberacoes,
        "total": len(deliberacoes),
        "saved": saved,
    }


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
        status = 200 if "error" not in result else 422
        self._respond(status, result)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        self._respond(200, {
            "status": "ok",
            "service": "iris-pdf-analyzer",
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
