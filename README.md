# MS ADS Program Assistant — Frontend

A React + Vite frontend for a chatbot that answers questions about the
University of Chicago MS in Applied Data Science program.

## Stack
- React 18
- Vite 5
- Plain CSS (no framework — design tokens live in `src/index.css`)

## Backend contract

The app POSTs to `http://localhost:8000/chat`:

```json
{ "question": "user message here", "k": 3 }
```

and renders:

```json
{
  "question": "...",
  "answer": "...",
  "sources": [
    { "source": "C:\\...\\file.txt", "chunk_id": 11, "preview": "..." }
  ]
}
```

`k` is user-selectable (3 / 5 / 8) from the composer. Source paths are
stripped down to the filename in the UI; the full path is preserved as a
hover tooltip.

## Running

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`. Make sure your FastAPI
(or other) backend is up at `http://localhost:8000` with CORS enabled
for the dev origin. A minimal FastAPI CORS snippet:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If the backend is unreachable, the assistant renders a clear inline
connection-error card instead of crashing.

## File layout

```
.
├─ index.html         # Vite entry (also doubles as a standalone preview via CDN React)
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.jsx        # ReactDOM bootstrap
│  ├─ App.jsx         # Whole app (Header / Empty / Messages / Sources / Composer)
│  ├─ App.css         # Component styles
│  └─ index.css       # Design tokens + globals
```

## Customizing

All design tokens (colors, type, radii, shadows) live as CSS custom
properties at the top of `src/index.css`. Change `--accent` once and the
whole app retints.

The accent is a deep academic burgundy expressed in `oklch()` — swap to
any hue while keeping chroma and lightness for a coherent recolor:

```css
--accent: oklch(0.38 0.12 25);  /* burgundy */
/* --accent: oklch(0.38 0.12 250);  /* navy */
/* --accent: oklch(0.38 0.12 145);  /* forest */
```

## Notes

- No OpenAI key, no third-party LLM SDK on the client. The frontend
  only talks to your `/chat` endpoint.
- Enter sends; Shift+Enter inserts a newline.
- The "Sources" panel under each answer is collapsed by default. Each
  source shows filename, `chunk_id`, and `preview`.
- Mobile breakpoint at 640px collapses the starter grid to one column
  and hides keyboard hints.
