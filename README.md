# Juriscore

<img src="./assets/header.svg" width="100%" alt="Juriscore" />

Legal research for Kenyan law students. Search cases, read structured briefs, compare holdings, and generate citations without wading through raw PDFs.

## Features

- Case search by keyword, court, year, judge, or subject
- Structured briefs: facts, issues, holding, ratio, obiter
- Side-by-side case comparison
- Citation generator for common Kenyan formats
- Mobile-first (React Native + Expo)

## Stack

React Native, Expo, FastAPI, Supabase.

## Run locally

    npm install
    # API
    uvicorn app.main:app --reload
    # App
    npx expo start

## License

MIT
