from fastapi import APIRouter, Query
from typing import Optional
from api.backend.services import corpus

router = APIRouter()


@router.get("")
async def list_treaties(
    q: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
):
    """List treaties from the local Juriscore corpus (independent of kenyalaw.org)."""
    items = corpus.get_docs("treaties")
    if q:
        ql = q.lower()
        items = [
            t
            for t in items
            if ql in str(t.get("title", "")).lower()
            or ql in str(t.get("topic", "")).lower()
            or ql in str(t.get("summary", "")).lower()
        ]
    results = items[:limit]
    for t in results:
        t.setdefault("source", "local_corpus")
    return {"count": len(results), "results": results, "source": "local_corpus", "independent": True}


@router.get("/{treaty_id}")
async def get_treaty(treaty_id: str):
    for t in corpus.get_docs("treaties"):
        if t.get("id") == treaty_id:
            return t
    return {"error": "Treaty not found"}


@router.get("/categories/list")
async def list_categories():
    topics = sorted({t.get("topic") or "Other" for t in corpus.get_docs("treaties")})
    return {"categories": topics}
