# Juriscore web UI — design notes

## Mode
Existing product rebuild for **usability**, not kenyalaw.org directory density.
Audience: Kenyan law students. Job: find → understand brief → save → cite.

## Tokens (`public/css/workspace.css`)
- `--ink` #14213D, `--paper` #FAFAF8, `--card` #FFFFFF
- `--rule` #E2E5EB, `--muted` #6B7280
- `--accent` #00327D (kept from brand), `--accent-soft` #E8EEF8
- Type: Georgia display for case titles; Segoe UI/system body; Consolas citations
- Layout: 240px sidebar + 920px content column; mobile drawer nav

## Information architecture (intentional drop of kenyalaw-style mega-nav)
Primary: Home · Search · Constitution · Notebook · Flashcards · Bookmarks  
Library (secondary): Statutes · Gazette · Cause lists  
Removed from primary chrome: counties, treaties, EAC, parliament, publications, tribunals (still in API)

## Signature
Search-first home (“What are you researching?”) + docket-style result cards
(court chip, mono citation, brief action bar).

## Guest mode
Browse/search works without login so the app is usable immediately;
sign-in required to persist notebook/bookmarks/flashcards.

## Serve
`uvicorn api.backend.main:app --port 8000` → http://127.0.0.1:8000/
