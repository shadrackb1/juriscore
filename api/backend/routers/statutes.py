from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Any
from datetime import datetime
from api.backend.services import corpus
from api.backend.core import get_session
from api.backend.models.database import Statute as DbStatute
from sqlalchemy import select, or_, and_
import logging

logger = logging.getLogger("juriscore")
router = APIRouter()


def _corpus_statute_to_api(s: dict) -> dict:
    return {
        "id": s.get("id"),
        "title": s.get("title"),
        "citation": s.get("citation"),
        "cap_number": s.get("cap_number"),
        "year": s.get("year"),
        "summary": s.get("summary"),
        "full_text": s.get("full_text") or "",
        "sections": s.get("sections") or [],
        "amendments": s.get("amendments") or [],
        "source": "local_corpus",
        "created_at": datetime.utcnow().isoformat(),
    }


@router.get("/")
async def list_statutes(
    q: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """Statutes primarily from the independent local corpus, with DB merge."""
    items = corpus.search_statutes(q) if q else corpus.get_statutes()
    results = [_corpus_statute_to_api(s) for s in items]

    # Merge any DB-only statutes
    try:
        stmt = select(DbStatute)
        if q:
            stmt = stmt.where(or_(DbStatute.title.ilike(f"%{q}%"), DbStatute.citation.ilike(f"%{q}%")))
        db_rows = (await session.execute(stmt)).scalars().all()
        seen = {r["id"] for r in results}
        for s in db_rows:
            if s.id not in seen:
                results.append({
                    "id": s.id,
                    "title": s.title,
                    "citation": s.citation,
                    "cap_number": s.cap_number,
                    "summary": None,
                    "full_text": s.full_text or "",
                    "sections": [],
                    "amendments": s.amendments or [],
                    "source": "database",
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                })
    except Exception as e:
        logger.debug(f"DB statute merge skipped: {e}")

    return results


@router.get("/search")
async def search_statutes(
    q: Optional[str] = Query(None),
    cap_number: Optional[str] = Query(None),
):
    items = corpus.search_statutes(q, cap_number=cap_number)
    return [
        {
            "id": s.get("id"),
            "title": s.get("title"),
            "citation": s.get("citation"),
            "cap_number": s.get("cap_number"),
            "summary": s.get("summary"),
            "source": "local_corpus",
        }
        for s in items
    ]


@router.get("/{statute_id}")
async def get_statute(statute_id: str):
    s = corpus.get_statute(statute_id)
    if not s:
        raise HTTPException(status_code=404, detail="Statute not found")
    return _corpus_statute_to_api(s)


@router.get("/{statute_id}/sections")
async def get_statute_sections(statute_id: str, q: Optional[str] = Query(None)):
    s = corpus.get_statute(statute_id)
    if not s:
        raise HTTPException(status_code=404, detail="Statute not found")
    sections = s.get("sections") or []
    if not sections:
        paragraphs = [p.strip() for p in (s.get("full_text") or "").split("\n\n") if p.strip()]
        sections = [{"text": p} for p in paragraphs]
    if q:
        ql = q.lower()
        sections = [
            sec
            for sec in sections
            if ql in str(sec).lower() or ql in str(sec.get("text", "")).lower() or ql in str(sec.get("heading", "")).lower()
        ]
    return {"statute_id": statute_id, "title": s.get("title"), "sections": sections, "source": "local_corpus"}
