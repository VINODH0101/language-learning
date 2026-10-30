#!/usr/bin/env python3
"""
Lexilume — Central Connection & API Health Verification Script.

Tests connectivity for:
1. Supabase Database & PostgREST API
2. Google Gemini API
3. SMTP (Gmail App Password) or Resend Email
4. External Public Educational APIs (MyMemory, FreeDictionary, Wikipedia, etc.)

Usage:
    python scripts/verify_connections.py
"""

from __future__ import annotations

import json
import os
import smtplib
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Load environment variables from .env or frontend/.env if present
def load_env_files():
    root = Path(__file__).resolve().parent.parent
    for env_path in [root / ".env", root / "frontend" / ".env", root / "frontend" / ".env.local"]:
        if env_path.is_file():
            try:
                for line in env_path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v
            except Exception:
                pass

load_env_files()

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Windows color support fallback
if sys.platform == "win32":
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except Exception:
        GREEN = RED = YELLOW = CYAN = BOLD = RESET = ""


def print_header(title: str):
    print(f"\n{BOLD}{CYAN}=== {title} ==={RESET}")


def check_external_apis():
    print_header("External Educational APIs (Zero Paid Keys Required)")
    
    endpoints = [
        ("MyMemory Translation", "https://api.mymemory.translated.net/get?q=ol%C3%A1&langpair=pt|en"),
        ("Free Dictionary API (EN)", "https://api.dictionaryapi.dev/api/v2/entries/en/hello"),
        ("Wikipedia REST API (PT)", "https://pt.wikipedia.org/api/rest_v1/page/summary/Portugal"),
        ("Wikipedia REST API (ES)", "https://es.wikipedia.org/api/rest_v1/page/summary/Espa%C3%B1a"),
        ("Dicion\u00e1rio Aberto (PT)", "https://dicionario-aberto.net/search-json/palavra"),
        ("LanguageTool Grammar Checker", "https://api.languagetoolplus.com/v2/languages"),
        ("Jikan Anime/Manga API", "https://api.jikan.moe/v4/anime/1"),
    ]

    for name, url in endpoints:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Lexilume-HealthCheck/2.0 (contact@lexilume.com)"}
            )
            with urllib.request.urlopen(req, timeout=6) as resp:
                if resp.status in (200, 201):
                    print(f"  [{GREEN}CONNECTED{RESET}] {name} (HTTP {resp.status})")
                else:
                    print(f"  [{YELLOW}WARNING{RESET}] {name} returned HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            if e.code in (404, 403, 429):
                print(f"  [{YELLOW}REACHABLE{RESET}] {name} (HTTP {e.code} - Service live)")
            else:
                print(f"  [{RED}FAIL{RESET}] {name} (HTTP {e.code})")
        except Exception as e:
            print(f"  [{RED}OFFLINE{RESET}] {name}: {e}")


def check_supabase():
    print_header("Supabase PostgreSQL Database & REST API")
    url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

    if not url or not key or "placeholder" in url or "placeholder" in key:
        print(f"  [{YELLOW}NOT CONFIGURED{RESET}] Neither SUPABASE_URL nor SUPABASE_SERVICE_ROLE_KEY is set in your environment / .env.")
        print("    -> Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your GitHub Secrets or local .env.")
        return

    test_endpoint = f"{url.rstrip('/')}/rest/v1/user_profiles?select=count&limit=1"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "User-Agent": "Lexilume-HealthCheck/2.0",
    }
    req = urllib.request.Request(test_endpoint, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            print(f"  [{GREEN}CONNECTED{RESET}] Supabase Database PostgREST responded with HTTP {resp.status} OK!")
            print(f"    Target: {url}")
    except urllib.error.HTTPError as e:
        if e.code == 401 or e.code == 403:
            print(f"  [{RED}AUTH ERROR{RESET}] HTTP {e.code}: Invalid Supabase API Key or permissions issue.")
        else:
            print(f"  [{RED}HTTP ERROR{RESET}] HTTP {e.code}: {e.reason}")
    except Exception as e:
        print(f"  [{RED}CONNECTION ERROR{RESET}] Could not connect to Supabase: {e}")


def check_gemini():
    print_header("Google Gemini AI API")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    configured_model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    normalized_configured = (
        configured_model[len("models/"):]
        if configured_model.startswith("models/")
        else configured_model
    )

    if not gemini_key or not gemini_key.strip():
        print(f"  [{YELLOW}NOT CONFIGURED{RESET}] GEMINI_API_KEY is not set.")
        print("    -> Add GEMINI_API_KEY to your GitHub Secrets or local .env to enable AI dialogue generation.")
        return

    # 1. Model Discovery via https://generativelanguage.googleapis.com/v1beta/models
    query_params = urllib.parse.urlencode({"key": gemini_key.strip()})
    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?{query_params}"
    req = urllib.request.Request(list_url, headers={"User-Agent": "Lexilume-HealthCheck/2.0"})

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models = data.get("models", [])

            # Filter models that explicitly support generateContent
            content_models = [
                m for m in models
                if "generateContent" in m.get("supportedGenerationMethods", [])
            ]
            content_model_names = [
                m.get("name", "").replace("models/", "") for m in content_models
            ]

            print(
                f"  [{GREEN}API KEY VALID{RESET}] Discovered {len(models)} model(s) "
                f"({len(content_models)} supporting content generation)."
            )

            # Check if configured model is in active content models
            if normalized_configured in content_model_names:
                print(f"  [{GREEN}MODEL READY{RESET}] Configured model '{normalized_configured}' is active and supports generateContent.")
            else:
                print(
                    f"  [{YELLOW}MODEL UNAVAILABLE{RESET}] Configured model '{configured_model}' not found in active generateContent models."
                )
                sample_available = content_model_names[:5]
                print(f"    Available generation models: {', '.join(sample_available)}")

    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            print(f"  [{RED}AUTH ERROR{RESET}] HTTP {e.code}: Invalid GEMINI_API_KEY or access restricted. Verify at https://aistudio.google.com/")
            return
        elif e.code == 429:
            print(f"  [{RED}QUOTA ERROR{RESET}] HTTP 429: Rate limit or daily quota exhausted.")
            return
        elif e.code == 404:
            print(f"  [{RED}ENDPOINT ERROR{RESET}] HTTP 404: Model discovery endpoint unreachable.")
            return
        else:
            print(f"  [{RED}HTTP ERROR{RESET}] HTTP {e.code}: {e.reason}")
            return
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"  [{RED}NETWORK ERROR{RESET}] Gemini connection timed out or unreachable: {e}")
        return
    except Exception as e:
        print(f"  [{RED}ERROR{RESET}] Unexpected Gemini error: {e}")
        return

    # 2. Live Generation Verification
    try:
        from engine.generators.gemini_generator import GeminiLessonGenerator
        gen = GeminiLessonGenerator(api_key=gemini_key, model=configured_model, timeout_seconds=10.0)
        res = gen.verify_generation(prompt="Say hello in Portuguese in 3 words")
        if res.get("success"):
            print(f"  [{GREEN}GENERATION VERIFIED{RESET}] Model '{normalized_configured}' generated content successfully!")
        else:
            cat = res.get("category", "UNKNOWN")
            print(f"  [{YELLOW}GENERATION NOTICE{RESET}] Live generation ping returned [{cat}]: {res.get('error')}")
            print("    -> Pedagogical engine will automatically use deterministic educational fallback if generation fails.")
    except Exception as e:
        print(f"  [{YELLOW}GENERATION NOTICE{RESET}] Generation verification skipped: {e}")


def check_email():
    print_header("Email Delivery (SMTP / Gmail App Password or Resend)")
    provider = os.environ.get("EMAIL_PROVIDER", "smtp").lower()
    print(f"  Provider configured: {provider}")

    if provider == "smtp":
        host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        port = int(os.environ.get("SMTP_PORT", 587))
        username = (
            os.environ.get("SMTP_USERNAME")
            or os.environ.get("GMAIL_USERNAME")
            or os.environ.get("EMAIL_USERNAME")
            or os.environ.get("EMAIL_USER")
        )
        password = (
            os.environ.get("SMTP_PASSWORD")
            or os.environ.get("GMAIL_APP_PASSWORD")
            or os.environ.get("GMAIL_PASSWORD")
            or os.environ.get("EMAIL_PASSWORD")
            or os.environ.get("APP_PASSWORD")
        )

        if not username or not password:
            print(f"  [{YELLOW}NOT CONFIGURED{RESET}] SMTP_USERNAME or SMTP_PASSWORD is not set.")
            print("    -> Add SMTP_USERNAME and SMTP_PASSWORD (Gmail 16-char App Password) to GitHub Secrets or .env.")
            return

        print(f"  Connecting to {host}:{port} with username '{username}'...")
        try:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls()
                server.login(username, password)
                print(f"  [{GREEN}AUTHENTICATED{RESET}] Successfully logged into {host} via STARTTLS! Credentials are 100% valid.")
        except smtplib.SMTPAuthenticationError as e:
            print(f"  [{RED}AUTH FAILED{RESET}] Google SMTP rejected username/password: {e}")
            print("    -> Make sure 2-Step Verification is ON and you generated a 16-character 'App Password'.")
        except Exception as e:
            print(f"  [{RED}CONNECTION FAILED{RESET}] Could not connect to SMTP server: {e}")

    elif provider == "resend":
        key = os.environ.get("RESEND_API_KEY")
        if not key or not key.startswith("re_"):
            print(f"  [{YELLOW}NOT CONFIGURED{RESET}] RESEND_API_KEY is not set or invalid.")
        else:
            print(f"  [{GREEN}CONFIGURED{RESET}] RESEND_API_KEY is configured format (re_...).")


def main():
    print(f"{BOLD}===================================================={RESET}")
    print(f"{BOLD}    Lexilume — Services & API Connection Check    {RESET}")
    print(f"{BOLD}===================================================={RESET}")
    check_external_apis()
    check_supabase()
    check_gemini()
    check_email()
    print(f"\n{BOLD}{CYAN}Verification complete.{RESET}\n")


if __name__ == "__main__":
    main()
