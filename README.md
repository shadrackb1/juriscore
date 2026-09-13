# Juriscore

<img src="./assets/header.svg" width="100%" alt="Juriscore" />

**Legal research for Kenyan law students** — search case law and statutes, read structured briefs, save notes, and study flashcards without wading through raw PDFs.

Juriscore is **independent of kenyalaw.org at runtime**. Core catalogs ship with the repo (~25k local documents) and are served from Juriscore’s own corpus.

| | |
|---|---|
| **Web app** | Search-first research workspace (guest mode + signed-in study tools) |
| **Mobile** | Expo / React Native client with auth, notebook, flashcards |
| **API** | FastAPI — `/api/v1` OpenAPI docs |
| **Corpus** | Constitution, statutes, judgments, gazettes, tribunals, cause lists, and more |

---

## Why Juriscore

Kenyan legal research is often a directory of links and PDFs. Juriscore is built for the student loop:

1. **Search** a principle, case name, or statute  
2. **Read** a brief — facts, issues, holding, ratio, obiter  
3. **Save** to a notebook or bookmark  
4. **Study** with flashcards  
5. **Cite** in a common Kenyan format  

Primary UI is intentionally small: Home · Search · Constitution · Notebook · Flashcards · Bookmarks. Deeper catalogs stay in the API and a secondary Library section.

---

## Features

### Research
- Universal search across local corpus (constitution, statutes, judgments, gazettes, tribunals, …)
- Filters by document type (cases, statutes, constitution, gazettes, tribunals)
- Structured briefs from curated authorities; full-text extracts where available
- Citation helper for common Kenyan formats
- Guest browse without an account

### Study tools
- Notebook (study notes) — create, list, delete
- Flashcard decks with spaced-repetition fields — create deck, add cards, study mode
- Bookmarks on search results
- Save any result as a note or flashcard from the brief view

### Corpus (independent of kenyalaw.org)

| Collection | Count |
|------------|------:|
| Judgments / cases (incl. full catalog) | **12,272** |
| Statutes & Cap. laws | 87 |
| Constitution articles | 76 |
| Gazette notices | 28 |
| Cause lists | 25 |
| Parliament / bills | 17 |
| Publications | 20 |
| Subsidiary legislation | 14 |
| County legislation | 12 |
| Tribunals | 10 |
| Treaties | 10 |
| EAC instruments | 12 |
| Counties | 47 |
| Courts & tribunals directory | 15 |
| Practice directions | 8 |
| Sentencing guidelines | 8 |
| Law reports | 5 |
| **Total documents** | **~24,905** |

Judgment catalog entries include title, citation, court, year, topic, and source metadata. Curated landmark cases include fuller briefs.

---

## Architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    W[Web workspace<br/>public/app.html]
    M[Expo mobile<br/>frontend/]
  end
  subgraph api [FastAPI /api/v1]
    S[Search]
    C[Corpus catalogs]
    T[Study tools API]
    A[Auth JWT]
  end
  subgraph data [Local corpus]
    K[data/corpus JSON<br/>~25k docs]
    L[legal_db judgments]
  end
  W --> S
  W --> C
  M --> S
  M --> A
  S --> K
  S --> L
  C --> K
  A --> T
```

```text
juriscore/
├── api/                    # Vercel entry (api/index.py) → FastAPI app
│   └── backend/
│       ├── main.py         # App, middleware, routers
│       ├── routers/        # search, auth, study, corpus catalogs, …
│       ├── services/corpus.py
│       └── data/corpus/    # JSON legal corpus (shipped with repo)
├── public/                 # Web research workspace (no sign-in)
├── frontend/               # Expo React Native
└── vercel.json
```

**Stack:** FastAPI · SQLAlchemy (SQLite / Postgres) · JWT auth · Expo/React Native · optional Docker · Vercel serverless.

---

## Quick start

### 1. API + web UI

```bash
pip install -r requirements.txt
uvicorn api.backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000/** — research workspace at `/`.

| URL | What |
|-----|------|
| `/` | Web research workspace |
| `/api/v1/docs` | OpenAPI docs |
| `/health` | Health check |
| `/api/v1/corpus/stats` | Corpus inventory |

Docker:

```bash
docker compose up --build
```

### 2. Mobile (Expo)

```bash
cd frontend
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL if needed
npx expo start
```

Android emulator: use `http://10.0.2.2:8000` as the API URL.

---

## API overview

Base path: `/api/v1`

| Area | Examples |
|------|----------|
| **Search** | `GET /search?q=fair+hearing` |
| **Corpus** | `GET /corpus/stats` · `GET /corpus/search?q=…` · `GET /corpus/statutes` |
| **Auth** | `POST /auth/signup` · `POST /auth/login` · `GET /auth/me` |
| **Study** | `GET/POST /study/notes` |
| **Notebook** | `GET/POST /notebook/folders` |
| **Flashcards** | `GET/POST /flashcards/decks` · `GET/POST /flashcards/decks/{id}/cards` |
| **Bookmarks** | `GET/POST /bookmarks/` |
| **Constitution** | `GET /constitution/chapters` · `GET /constitution/articles/{n}` |
| **Statutes** | `GET /statutes/` · `GET /statutes/search?q=employment` |
| **Catalogs** | `/gazettes/` · `/tribunals/` · `/cause-list` · `/parliament` · `/treaties` · `/eac` · `/counties` · `/publications` |

Protected routes require `Authorization: Bearer <token>`.

---

## Deploy on Vercel

Ready out of the box (`vercel.json` + `api/index.py` + `runtime.txt`).

1. Import **`github.com/shadrackb1/juriscore`** (root = repo root).
2. Framework preset: **Other**.
3. Environment variables (recommended):

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | Sign auth tokens | dev secret (change in prod) |
| `CORS_ORIGINS` | Allowed origins | `*` |
| `AUTO_CRAWL` | Start KenyaLaw crawler on boot | `false` |
| `LIVE_KENYALAW` | Allow outbound kenyalaw search | `false` |
| `DATABASE_URL` | Persistent DB | serverless temp SQLite |

4. Deploy → app at `/`, API at `/api/v1/…`, docs at `/docs`.

```bash
npx vercel --prod
```

**Persistence:** Serverless SQLite is ephemeral. For durable accounts and notes, set `DATABASE_URL` to Postgres, e.g. `postgresql+asyncpg://user:pass@host/db`.

---

## Configuration notes

- **Independent mode (default):** corpus-first search; crawler and live kenyalaw scraping off.
- **Enrichment (optional):** `AUTO_CRAWL=true` or `LIVE_KENYALAW=true` to pull more full-text over time.
- **AI chat / summaries:** optional keys (`OPENAI_API_KEY`, NVIDIA/Mistral in `.env`); search and study tools work without them.
- **Root `.env`** is gitignored; see `api/backend/.env.example`.

---

## Development

```bash
# API
uvicorn api.backend.main:app --reload --port 8000

# Frontend typecheck
cd frontend && npm run typecheck

# Expand/merge corpus (optional)
python scripts/expand_corpus.py
```

Design notes for the web UI: [`public/DESIGN_NOTES.md`](public/DESIGN_NOTES.md).

---

## License

[MIT](./LICENSE)
