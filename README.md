# Juriscore

<img src="./assets/header.svg" width="100%" alt="Juriscore" />

Legal research for Kenyan law students. Search cases, read structured briefs, compare holdings, and generate citations without wading through raw PDFs. **Fully independent**: all core catalogs (constitution, statutes, cases, gazettes, tribunals, cause lists, parliament, publications, treaties, EAC, counties, courts) are served from Juriscore's own local corpus — no kenyalaw.org dependency at runtime.

## Features

- Case search by keyword, court, year, judge, or subject — **12,000+ judgment catalog**
- Structured briefs: facts, issues, holding, ratio, obiter
- Side-by-side case comparison
- Citation generator for common Kenyan formats
- Auth, notebook, flashcards, bookmarks
- Constitution (70+ articles), statutes, gazettes, tribunals
- Cause lists, parliament/bills, publications, treaties, EAC, counties
- Practice directions, sentencing guidelines, subsidiary & county legislation
- Mobile app (React Native + Expo) and static web UI
- **Fully independent local corpus** (~25k documents)

## Stack

React Native, Expo, FastAPI, SQLite/Postgres.

## Run locally

### API

```bash
pip install -r requirements.txt
uvicorn api.backend.main:app --reload --host 0.0.0.0 --port 8000
```

- Docs: http://localhost:8000/api/v1/docs
- Health: http://localhost:8000/health

Docker:

```bash
docker compose up --build
```

### Mobile (Expo)

```bash
cd frontend
npm install
npx expo start
```

Copy `frontend/.env.example` to `frontend/.env` and set `EXPO_PUBLIC_API_URL` if needed.

### Web UI

Open http://localhost:8000/ after starting the API — the research workspace (`public/app.html`) is served at `/`.

## Deploy on Vercel

The repo is configured for Vercel out of the box (`vercel.json` + `api/index.py`).

1. Import `github.com/shadrackb1/juriscore` in Vercel (root directory = repo root).
2. Framework preset: **Other**. Vercel uses `@vercel/python` for `api/index.py` and static `public/**`.
3. Set environment variables (optional but recommended):

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Sign auth tokens (set a long random string in production) |
| `CORS_ORIGINS` | Default `*` |
| `AUTO_CRAWL` | Keep `false` on serverless |
| `LIVE_KENYALAW` | Keep `false` (local corpus only) |

4. Deploy. After build:
   - App: `https://<project>.vercel.app/`
   - API: `https://<project>.vercel.app/api/v1/...`
   - Health: `https://<project>.vercel.app/health`
   - Docs: `https://<project>.vercel.app/docs`

SQLite auth/user data uses a serverless temp file; for durable users/notes use Postgres via `DATABASE_URL` (Neon/Supabase) with `postgresql+asyncpg://…`.

```bash
# CLI deploy
npx vercel --prod
```

## License

MIT
