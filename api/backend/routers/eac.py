from fastapi import APIRouter, Query
from typing import Optional
from api.backend.services import corpus

router = APIRouter()


@router.get("")
async def list_eac_legislation(
    q: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
):
    """EAC instruments served from the local Juriscore corpus."""
    items = corpus.get_docs("eac")
    if q:
        ql = q.lower()
        items = [
            e
            for e in items
            if ql in str(e.get("title", "")).lower()
            or ql in str(e.get("category", "")).lower()
            or ql in str(e.get("summary", "")).lower()
        ]
    results = items[:limit]
    for e in results:
        e.setdefault("source", "local_corpus")
    return {"count": len(results), "results": results, "source": "local_corpus", "independent": True}


@router.get("/categories/list")
async def list_categories():
    cats = sorted({e.get("category") or "Other" for e in corpus.get_docs("eac")})
    return {"categories": cats}
