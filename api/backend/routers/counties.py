from fastapi import APIRouter, Query
from typing import Optional
from api.backend.services import corpus

router = APIRouter()


@router.get("")
async def list_counties(
    q: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
):
    """All 47 counties from the local Juriscore corpus."""
    counties = corpus.get_docs("counties")
    if q:
        ql = q.lower()
        counties = [c for c in counties if ql in str(c.get("name", "")).lower()]
    if region:
        rl = region.lower()
        counties = [c for c in counties if rl in str(c.get("region", "")).lower()]
    results = counties[:limit]
    for c in results:
        c.setdefault("source", "local_corpus")
    return {
        "count": len(results),
        "results": results,
        "total_counties": len(corpus.get_docs("counties")),
        "source": "local_corpus",
        "independent": True,
    }


@router.get("/regions/list")
async def list_regions():
    regions = sorted({c.get("region") or "" for c in corpus.get_docs("counties") if c.get("region")})
    return {"regions": regions}


@router.get("/{county_id}")
async def get_county(county_id: str):
    for c in corpus.get_docs("counties"):
        if c.get("id") == county_id:
            return c
    return {"error": "County not found"}
