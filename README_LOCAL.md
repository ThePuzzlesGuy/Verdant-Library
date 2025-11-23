
# Verdant Library — Local-Only Build

- **Persistence**: Browser LocalStorage (`vh_books_v1`).
- **Seed**: `data/library.json` (loaded on first visit, then saved locally).
- **Edits & Fetch Covers**: Saved locally in your browser. Other visitors will load their own seed unless they edit.
- **Admin**: Added **Reset to Seed** button to discard local edits and reload the original `data/library.json`.

No serverless functions, no databases, no tokens. Works on any static host (GitHub Pages, Netlify, etc.).
