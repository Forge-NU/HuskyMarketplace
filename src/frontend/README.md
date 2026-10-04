# Frontend

The Husky Marketplace web app, built with Next.js 16 (React + TypeScript, App Router).

## Run it locally

```bash
cd src/frontend
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build` (production build), `npm run lint`.

## Layout

```
app/
  layout.tsx            # header, footer, toast provider, Archivo font
  globals.css           # design tokens (colors, radii) + shared classes (.btn, .chip, .muted)
  page.tsx              # browse page
  listings/[id]/        # listing detail (placeholder for now)
components/
  Header.tsx, SearchPill.tsx, Footer.tsx, Icon.tsx, Skyline.tsx
  listings/             # BrowseView, CategoryNav, ListingGrid, ListingCard
  ui/Toast.tsx          # useToast() hook
lib/
  types.ts              # Listing, Seller, Category
  mock-data.ts          # sample data until the FastAPI backend exists
  use-filters.ts        # browse filters, stored in the URL (?mode=services&cat=tutoring)
  format.ts             # price/rating formatting
```

Each component keeps its styles next to it in a `*.module.css` file.

## Porting the rest of the prototype

The original single-file design lives at `docs/prototype/index.html`. Open it in a browser to compare. Still to port: sign in, messages, saved items, profile, settings, post a listing, and the full listing detail.

How the old code maps onto React:

| Prototype | Next.js |
|---|---|
| `renderX()` building HTML strings | a component returning JSX |
| `onclick="f()"` | `onClick={() => f()}` |
| `document.getElementById(...)` | state, props, or `useRef` |
| global `state` / `go(view)` | URL search params / routes in `app/` |
| `toast("...")` | `const toast = useToast()` |

**Heads up:** the prototype defines several functions twice (`go`, `render`, `openDetail`, `toggleSave`, `renderCats`, `messageSeller`, `finishSignin`, `renderAcct`, `acctClick`). The browser uses the **second** definition, so port that one.
