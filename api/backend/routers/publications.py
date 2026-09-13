from fastapi import APIRouter, Query
from typing import Optional
from api.backend.services import corpus

router = APIRouter()


@router.get("")
async def list_publications(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
):
    """Law reports, journals, bulletins and study materials from local corpus."""
    items = corpus.get_docs("publications")
    if q:
        ql = q.lower()
        items = [
            p
            for p in items
            if ql in str(p.get("title", "")).lower()
            or ql in str(p.get("summary", "")).lower()
            or ql in str(p.get("category", "")).lower()
        ]
    if category:
        cl = category.lower()
        items = [p for p in items if cl in str(p.get("category", "")).lower()]
    results = items[:limit]
    for p in results:
        p.setdefault("source", "local_corpus")
        p.setdefault("type", p.get("category", "Publication"))
    return {"count": len(results), "results": results, "source": "local_corpus", "independent": True}


@router.get("/categories/list")
async def list_categories():
    cats = sorted({p.get("category") or "Other" for p in corpus.get_docs("publications")})
    return {"categories": cats}
