"""
Vercel serverless entrypoint.

Re-exports the full FastAPI app from api.backend.main with the project
root on sys.path so package imports resolve on Vercel.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Ensure serverless-friendly env defaults (no crawler, temp SQLite)
os.environ.setdefault("AUTO_CRAWL", "false")
os.environ.setdefault("LIVE_KENYALAW", "false")
os.environ.setdefault("VERCEL", "1")

from api.backend.main import app  # noqa: E402,F401

# ASGI handler alias some Vercel Python runtimes look for
handler = app
