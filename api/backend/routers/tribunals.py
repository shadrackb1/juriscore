from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import logging

from api.backend.services import corpus

logger = logging.getLogger("juriscore")
router = APIRouter()


class TribunalResponse(BaseModel):
    id: str
    title: str
    citation: Optional[str] = None
    tribunal_type: Optional[str] = None
    tribunal_name: str
    date: Optional[str] = None
    year: Optional[int] = None
    parties: Optional[str] = None
    subject: str
    summary: str
    outcome: Optional[str] = None
    decision: Optional[str] = None
    topics: Optional[List[str]] = None


class PaginatedTribunalResponse(BaseModel):
    items: List[TribunalResponse]
    total: int
    page: int
    limit: int
    pages: int


def _normalize(d: dict) -> dict:
    tribunal = d.get("tribunal") or d.get("tribunal_name") or "Tribunal"
    return {
        "id": d.get("id"),
        "title": d.get("title"),
        "citation": d.get("citation"),
        "tribunal_type": d.get("tribunal_type") or tribunal.split()[0].upper()[:4],
        "tribunal_name": tribunal,
        "date": d.get("date"),
        "year": int(d.get("year") or (d.get("date") or "0")[:4] or 0),
        "parties": d.get("parties"),
        "subject": d.get("subject") or d.get("title"),
        "summary": d.get("decision") or d.get("summary") or "",
        "outcome": d.get("decision") or d.get("outcome"),
        "decision": d.get("decision"),
        "topics": d.get("topics") or [],
    }


@router.get("/", response_model=PaginatedTribunalResponse)
async def list_tribunals(
    types: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
):
    filtered = [_normalize(d) for d in corpus.get_docs("tribunals")]
    if types:
        type_list = [t.strip().upper() for t in types.split(",")]
        filtered = [
            d
            for d in filtered
            if any(t in str(d.get("tribunal_type", "")).upper() or t in str(d.get("tribunal_name", "")).upper() for t in type_list)
        ]
    if year:
        filtered = [d for d in filtered if d.get("year") == year]
    if q:
        ql = q.lower()
        filtered = [
            d
            for d in filtered
            if ql in str(d.get("title", "")).lower()
            or ql in str(d.get("parties", "")).lower()
            or ql in str(d.get("subject", "")).lower()
            or ql in str(d.get("summary", "")).lower()
        ]
    total = len(filtered)
    pages_count = max(1, (total + limit - 1) // limit)
    items = filtered[(page - 1) * limit : page * limit]
    return PaginatedTribunalResponse(
        items=[TribunalResponse(**d) for d in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages_count,
    )


@router.get("/{decision_id}", response_model=TribunalResponse)
async def get_tribunal_decision(decision_id: str):
    for d in corpus.get_docs("tribunals"):
        if d.get("id") == decision_id:
            return TribunalResponse(**_normalize(d))
    raise HTTPException(status_code=404, detail="Tribunal decision not found")
