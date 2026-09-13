from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import logging

from api.backend.services import corpus

logger = logging.getLogger("juriscore")
router = APIRouter()


class GazetteResponse(BaseModel):
    id: str
    title: str
    gazette_number: str
    date: str
    category: str
    county: str
    type: str
    author: str
    summary: str
    pages: int
    status: Optional[str] = None


class PaginatedGazetteResponse(BaseModel):
    items: List[GazetteResponse]
    total: int
    page: int
    limit: int
    pages: int


def _gazettes():
    items = corpus.get_docs("gazettes")
    out = []
    for g in items:
        out.append(
            {
                "id": g.get("id"),
                "title": g.get("title"),
                "gazette_number": g.get("gazette_number"),
                "date": g.get("date"),
                "category": g.get("category"),
                "county": g.get("county"),
                "type": g.get("type"),
                "author": g.get("author"),
                "summary": g.get("summary"),
                "pages": int(g.get("pages") or 1),
                "status": g.get("status"),
            }
        )
    return out


@router.get("/", response_model=PaginatedGazetteResponse)
async def list_gazettes(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    county: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
):
    filtered = _gazettes()
    if q:
        ql = q.lower()
        filtered = [g for g in filtered if ql in g["title"].lower() or ql in g["summary"].lower()]
    if category:
        filtered = [g for g in filtered if g["category"].lower() == category.lower()]
    if date:
        filtered = [g for g in filtered if g["date"] == date]
    if county:
        filtered = [g for g in filtered if g["county"].lower() == county.lower()]
    if type:
        filtered = [g for g in filtered if g["type"].lower() == type.lower()]

    total = len(filtered)
    pages_count = max(1, (total + limit - 1) // limit)
    start = (page - 1) * limit
    items = filtered[start : start + limit]
    return PaginatedGazetteResponse(
        items=[GazetteResponse(**g) for g in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages_count,
    )


@router.get("/{gazette_id}", response_model=GazetteResponse)
async def get_gazette(gazette_id: str):
    gazette = next((g for g in _gazettes() if g["id"] == gazette_id), None)
    if not gazette:
        raise HTTPException(status_code=404, detail="Gazette notice not found")
    return GazetteResponse(**gazette)


@router.get("/{gazette_id}/text")
async def get_gazette_text(gazette_id: str):
    """Full local text of a gazette notice (no external PDF dependency)."""
    for g in corpus.get_docs("gazettes"):
        if g.get("id") == gazette_id:
            return {
                "id": g.get("id"),
                "title": g.get("title"),
                "gazette_number": g.get("gazette_number"),
                "date": g.get("date"),
                "body": g.get("summary"),
                "author": g.get("author"),
                "source": "local_corpus",
            }
    raise HTTPException(status_code=404, detail="Gazette notice not found")
