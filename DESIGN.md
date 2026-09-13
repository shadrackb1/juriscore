# Juriscore DESIGN.md

## Objective
A research workspace for Kenyan law students: find → brief → save → cite.
Not a government directory. Not a marketing site.

## Product context
- Primary job (90% of sessions): search a case/statute/principle and read a brief.
- Secondary: notebook, flashcards, bookmarks (local-only, no accounts).
- Audience: law students and early-career practitioners in Kenya.

## Visual foundations
| Token | Value |
|-------|--------|
| ink | #14213D |
| paper | #FAFAF8 |
| card | #FFFFFF |
| rule | #E2E5EB |
| muted | #6B7280 |
| accent | #00327D |
| accent-soft | #E8EEF8 |
| error | #B91C1C |
| display | Georgia, "Times New Roman", serif |
| body | "Segoe UI", system-ui, sans-serif |
| mono | "Cascadia Code", Consolas, monospace |
| radius | 12px / 8px |
| layout | 240px sidebar + 920px content |

## Accessibility
- Focus-visible 2px accent outline
- Skip link to #main-content
- prefers-reduced-motion disables animation
- Body contrast ≥ 4.5:1 on paper
- Tap targets ≥ 44px on mobile drawer nav

## Voice & tone
Plain verbs. Active voice. Empty states invite action.
No "seamlessly unlock potential." No emoji decoration.

## Implementation
- Static SPA in public/app.html + workspace.css
- API under /api/v1; study tools in localStorage
- Serve from FastAPI / Vercel static

## Anti-patterns (do not add)
- Gradient hero purple-blue-cyan
- 6-up icon card grids with emoji
- Isometric people illustrations
- Floating "47% YoY" stat card trios
- Every control as a filled primary button
- Google Fonts dependency for first paint

## Decision trace
1. **No auth in web UI** — student loop must work offline of accounts; tradeoff: notes not synced across devices.
2. **Keep brand navy #00327D** — existing product identity; tradeoff: less "fresh" than a new palette.
3. **Georgia + system UI** — legal register without CDN fonts; tradeoff: less unique than a custom face.
4. **Directory catalogs demoted** — primary nav is Search/Notebook; tradeoff: power users need Library section.
5. **localStorage study tools** — instant, no backend dependency; tradeoff: no cloud backup.

## Artifact: web workspace
- Home: search-first hero + quick chips + jump tiles + corpus count
- Search: docket cards (court, year, mono cite) + Open brief / Bookmark
- Brief: Facts · Issues · Holding · Ratio · Obiter + save actions
- Library: statutes, gazettes, cause lists
- Study: notebook, flashcards, bookmarks (local)
