from fastapi import APIRouter, Query
from typing import Optional
from api.backend.services import corpus

router = APIRouter()


@router.get("")
async def list_parliament_records(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    house: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
):
    """Parliamentary bills, Hansard extracts, and committee reports from local corpus."""
    items = corpus.get_docs("parliament")
    if q:
        ql = q.lower()
        items = [
            r
            for r in items
            if ql in str(r.get("title", "")).lower()
            or ql in str(r.get("summary", "")).lower()
            or ql in str(r.get("status", "")).lower()
        ]
    if category:
        cl = category.lower()
        items = [r for r in items if cl in (r.get("house", "") + r.get("status", "")).lower()]
    if house:
        hl = house.lower()
        items = [r for r in items if hl in str(r.get("house", "")).lower()]
    results = items[:limit]
    for r in results:
        r.setdefault("source", "local_corpus")
        r.setdefault("type", "Parliamentary Record")
    return {"count": len(results), "results": results, "source": "local_corpus", "independent": True}


@router.get("/categories/list")
async def list_categories():
    return {"categories": ["Bills", "Hansard", "Motions", "Committee Reports", "Questions", "PBO"]}
