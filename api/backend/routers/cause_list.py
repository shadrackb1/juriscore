from fastapi import APIRouter, Query
from typing import Optional
from api.backend.services import corpus

router = APIRouter()


@router.get("")
async def list_cause_lists(
    q: Optional[str] = Query(None),
    court: Optional[str] = Query(None),
    station: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
):
    """Court cause lists from the local Juriscore corpus."""
    items = corpus.get_docs("cause_lists")
    if q:
        ql = q.lower()
        items = [
            c
            for c in items
            if ql in str(c.get("court", "")).lower()
            or ql in str(c.get("type", "")).lower()
            or ql in str(c.get("station", "")).lower()
        ]
    if court:
        cl = court.lower()
        items = [c for c in items if cl in str(c.get("court", "")).lower()]
    if station:
        sl = station.lower()
        items = [c for c in items if sl in str(c.get("station", "")).lower()]
    results = items[:limit]
    for c in results:
        c.setdefault("source", "local_corpus")
    return {
        "count": len(results),
        "results": results,
        "total": len(corpus.get_docs("cause_lists")),
        "source": "local_corpus",
        "independent": True,
    }


@router.get("/categories/list")
async def list_categories():
    cats = sorted({c.get("type") or "Other" for c in corpus.get_docs("cause_lists")})
    return {"categories": cats}
