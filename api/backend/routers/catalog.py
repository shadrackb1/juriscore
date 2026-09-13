from fastapi import APIRouter, Query
from typing import Optional
from api.backend.services import corpus

router = APIRouter()


@router.get("/stats")
async def corpus_stats():
    """Inventory of the independent local legal corpus."""
    return corpus.stats()


@router.get("/search")
async def search_all_corpus(q: str = Query(...), doc_type: Optional[str] = None, limit: int = Query(30, le=100)):
    results = corpus.search_corpus(q, doc_type=doc_type, limit=limit)
    return {"query": q, "count": len(results), "results": results, "source": "local_corpus"}


@router.get("/{doc_type}")
async def list_corpus_type(doc_type: str, limit: int = Query(100, le=500)):
    allowed = {
        "constitution", "statutes", "cases", "cases_full", "gazettes", "tribunals",
        "cause_lists", "parliament", "publications", "treaties", "eac",
        "counties", "courts", "law_reports", "practice_directions",
        "sentencing_guidelines", "subsidiary_legislation", "county_legislation",
    }
    if doc_type not in allowed:
        return {"error": "Unknown document type", "allowed": sorted(allowed)}
    items = corpus.get_docs(doc_type)[:limit]
    return {"doc_type": doc_type, "count": len(items), "results": items, "source": "local_corpus"}
