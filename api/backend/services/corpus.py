"""
Local legal corpus loader — Juriscore independent of kenyalaw.org at runtime.

Loads JSON documents from api/backend/data/corpus/ into an in-memory index
and optionally into the SQL database for search, browse, and study tools.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger("juriscore")

CORPUS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "corpus")
)

_store: Dict[str, List[Dict[str, Any]]] = {
    "constitution": [],
    "statutes": [],
    "cases": [],
    "cases_full": [],
    "gazettes": [],
    "tribunals": [],
    "cause_lists": [],
    "parliament": [],
    "publications": [],
    "treaties": [],
    "eac": [],
    "counties": [],
    "courts": [],
    "law_reports": [],
    "practice_directions": [],
    "sentencing_guidelines": [],
    "subsidiary_legislation": [],
    "county_legislation": [],
}

_ready = False
_search_index: Dict[str, List[Dict[str, Any]]] = {}
# Lightweight title/citation index for large case sets (cases_full)
_case_title_index: List[Dict[str, Any]] = []


def _load_file(name: str) -> List[Dict[str, Any]]:
    path = os.path.join(CORPUS_DIR, f"{name}.json")
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("items", "results", "data", "documents"):
                if key in data and isinstance(data[key], list):
                    return data[key]
        return []
    except Exception as e:
        logger.error(f"Failed to load corpus/{name}.json: {e}")
        return []


def load_corpus(force: bool = False) -> None:
    global _ready, _search_index, _case_title_index
    if _ready and not force:
        return

    for key in list(_store.keys()):
        _store[key] = _load_file(key)

    # Merge curated + full judgment catalog for browsing/search
    if _store["cases_full"]:
        # Deduplicate curated cases already present in full DB by title
        curated_titles = {c.get("title") for c in _store["cases"]}
        extra = [c for c in _store["cases_full"] if c.get("title") not in curated_titles]
        _store["cases"] = _store["cases"] + extra

    _search_index = {}
    _case_title_index = []
    for doc_type, docs in _store.items():
        for doc in docs:
            # Full inverted index for small collections; lighter for cases_full volume
            is_large_case = doc.get("source") == "legal_db" or doc.get("id", "").startswith("ldb-")
            if is_large_case:
                _case_title_index.append({
                    "title": (doc.get("title") or "").lower(),
                    "citation": (doc.get("citation") or "").lower(),
                    "court": (doc.get("court") or "").lower(),
                    "doc": {**doc, "doc_type": "cases"},
                })
                # Index only title+citation words for large set
                text = " ".join(
                    str(doc.get(k) or "") for k in ("title", "citation", "court", "year")
                ).lower()
            else:
                text = " ".join(
                    str(doc.get(k) or "")
                    for k in (
                        "title",
                        "name",
                        "citation",
                        "summary",
                        "body",
                        "content",
                        "full_text",
                        "excerpt",
                        "court",
                        "chapter",
                        "subject",
                        "category",
                        "topics",
                    )
                ).lower()
            words = set(re.findall(r"[a-z0-9]{2,}", text))
            entry = {**doc, "doc_type": "cases" if is_large_case else doc_type}
            for w in words:
                # Cap postings per term to keep memory bounded on large sets
                bucket = _search_index.setdefault(w, [])
                if len(bucket) < 500:
                    bucket.append(entry)

    total = sum(len(v) for v in _store.values())
    _ready = True
    logger.info(
        "Local legal corpus ready",
        extra={
            "documents": total,
            "types": {k: len(v) for k, v in _store.items()},
            "case_catalog": len(_case_title_index),
        },
    )


def is_ready() -> bool:
    if not _ready:
        load_corpus()
    return _ready


def get_docs(doc_type: str) -> List[Dict[str, Any]]:
    is_ready()
    return _store.get(doc_type, [])


def stats() -> Dict[str, Any]:
    is_ready()
    return {
        "ready": _ready,
        "counts": {k: len(v) for k, v in _store.items()},
        "total": sum(len(v) for v in _store.values()),
        "source": "local-corpus",
        "independent": True,
    }


def search_corpus(
    query: str,
    doc_type: Optional[str] = None,
    court: Optional[str] = None,
    limit: int = 30,
) -> List[Dict[str, Any]]:
    is_ready()
    if not query or not query.strip():
        return []

    words = re.findall(r"[a-z0-9]{2,}", query.lower())
    if not words:
        return []

    scores: Dict[str, float] = {}
    meta: Dict[str, Dict[str, Any]] = {}

    for w in words:
        hits = _search_index.get(w, [])
        if not hits:
            continue
        weight = 1.0 + (1.0 / (1 + len(hits) / 50))
        for hit in hits:
            key = f"{hit.get('doc_type')}:{hit.get('id') or hit.get('title')}"
            scores[key] = scores.get(key, 0.0) + weight
            meta[key] = hit

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    results: List[Dict[str, Any]] = []
    for key, score in ranked:
        doc = dict(meta[key])
        if doc_type and doc.get("doc_type") != doc_type:
            continue
        if court and court.lower() not in str(doc.get("court", "")).lower():
            continue
        doc["score"] = round(score, 3)
        doc["source"] = "local_corpus"
        results.append(doc)
        if len(results) >= limit:
            break

    # Fallback: substring scan of large judgment catalog when index is thin
    if len(results) < limit and (not doc_type or doc_type in ("cases", "case", "judgment")):
        seen = {r.get("id") or r.get("title") for r in results}
        ql = query.lower()
        for row in _case_title_index:
            if len(results) >= limit:
                break
            if ql in row["title"] or ql in row["citation"] or (court and court.lower() in row["court"]):
                doc = dict(row["doc"])
                key = doc.get("id") or doc.get("title")
                if key in seen:
                    continue
                if court and court.lower() not in row["court"]:
                    continue
                doc["score"] = 1.5
                doc["source"] = "legal_db"
                results.append(doc)
                seen.add(key)
    return results


def get_constitution_articles() -> List[Dict[str, Any]]:
    return get_docs("constitution")


def search_constitution(q: Optional[str] = None) -> List[Dict[str, Any]]:
    articles = get_constitution_articles()
    if not q:
        return articles
    ql = q.lower()
    out = []
    for a in articles:
        blob = " ".join(
            str(a.get(k) or "")
            for k in ("title", "content", "chapter", "article_num")
        ).lower()
        if ql in blob:
            out.append(a)
    return out


def get_statutes() -> List[Dict[str, Any]]:
    return get_docs("statutes")


def search_statutes(q: Optional[str] = None, cap_number: Optional[str] = None) -> List[Dict[str, Any]]:
    items = get_statutes()
    if cap_number:
        items = [s for s in items if str(s.get("cap_number") or "") == str(cap_number)]
    if q:
        ql = q.lower()
        items = [
            s
            for s in items
            if ql in str(s.get("title", "")).lower()
            or ql in str(s.get("citation", "")).lower()
            or ql in str(s.get("summary", "")).lower()
            or ql in str(s.get("full_text", "")).lower()
        ]
    return items


def get_statute(statute_id: str) -> Optional[Dict[str, Any]]:
    for s in get_statutes():
        if str(s.get("id")) == str(statute_id):
            return s
    return None


def get_cases(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    items = get_docs("cases")
    if limit:
        return items[:limit]
    return items


def search_cases_catalog(q: str, court: Optional[str] = None, year: Optional[int] = None, limit: int = 30) -> List[Dict[str, Any]]:
    is_ready()
    ql = (q or "").lower()
    out: List[Dict[str, Any]] = []
    for row in _case_title_index:
        if court and court.lower() not in row["court"]:
            continue
        doc = row["doc"]
        if year and doc.get("year") != year:
            continue
        if ql and ql not in row["title"] and ql not in row["citation"]:
            continue
        out.append(doc)
        if len(out) >= limit:
            break
    return out


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    for c in get_cases():
        if str(c.get("id")) == str(case_id):
            return c
    return None


def list_by(doc_type: str, **filters: Any) -> List[Dict[str, Any]]:
    items = get_docs(doc_type)
    for k, v in filters.items():
        if v is None or v == "":
            continue
        vl = str(v).lower()
        items = [
            i
            for i in items
            if vl in str(i.get(k, "")).lower() or vl in str(i.get("category", "")).lower()
        ]
    return items
