
# Husky Marketplace

A campus marketplace for Northeastern students to buy, sell, and connect over goods and services.

Built by the Forge software team at Northeastern University for Fall 2026 

**[Current Figma redesign](https://www.figma.com/design/ogZRLNukGpoXWCSgCjt8pD)** · **[GitHub repository](https://github.com/Forge-NU/software-team-3)**

## Overview

Moving into a dorm, furnishing an apartment, or leaving campus often means buying things that other students already have, then figuring out what to do with them a few months later. Existing resale platforms are broad, fragmented, and not designed around the cycles of campus life.

Husky Marketplace is being built to make secondhand exchange easier within the Northeastern community. The goal is to help students find affordable essentials, give items a second life, and connect with other students for local services such as moving help.

## Features and project status

The product is under development. The Next.js implementation currently lives on [`feature/marketplace-ui-refresh`](https://github.com/Forge-NU/software-team-3/tree/feature/marketplace-ui-refresh); `main` still contains the initial repository scaffold.

| Area | Current state |
| --- | --- |
| Browse goods and services | Implemented in Next.js with sample listings, search, categories, and filters |
| Student email sign-in | Supabase email one-time-code flow implemented; requires a configured Supabase project |
| Listing details | Basic Next.js detail page; full experience still in progress |
| Saved items | In-memory frontend interaction; not persisted between sessions |
| Profiles, messages, posting, and moving-help workflows | Designed in the HTML prototype; not yet fully ported to Next.js |
| Listings database | PostgreSQL schema and Row Level Security migration added; browsing still uses sample data |
| FastAPI backend and deployment | Planned; not yet documented as runnable or deployed |

The current interface is a development build, not a production marketplace. In particular, sample listings are not live student submissions, and a Northeastern email address alone is not proof of current enrollment.

## Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | Next.js 16, React 19, TypeScript | App Router-based web application |
| Styling | CSS Modules and global CSS | Component styles and shared design tokens |
| Authentication | Supabase Auth and `@supabase/ssr` | Email one-time codes and session handling |
| Database | Supabase PostgreSQL | Profiles and listings with Row Level Security |
| Backend | FastAPI (Python), planned | Future API and server-side business logic |
| Deployment | Not yet finalized | Hosting and release workflow to be documented |

## Getting started

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) **20.9 or later** and npm
- Access to the team's Supabase project and its development credentials

### 1. Clone and open the current implementation

```bash
git clone https://github.com/Forge-NU/software-team-3.git
cd software-team-3
git switch feature/marketplace-ui-refresh
cd src/frontend
```

> The frontend is not at the repository root. Until the integration branch is merged, use the branch above to run the application.

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Copy the frontend environment template:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead.

Update `.env.local` with the values for the team's Supabase project:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

These names match the current frontend configuration. Never commit `.env.local` or put a Supabase `service_role` key in frontend code.

**Supabase setup:** The project must have the migration in [`supabase/migrations/`](supabase/migrations/) applied, with the **Before User Created** authentication hook configured as described in [`supabase/README.md`](supabase/README.md). Ask the project lead for access if you cannot configure the shared project yourself.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The application redirects signed-out users to `/login` and expects a working Supabase connection.

### Available commands

Run these from `src/frontend`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm run start` | Serve a production build after building |

There is no automated test script configured in the current frontend package.

## Repository structure

```text
software-team-3/
├── .github/                 # Issue and pull request templates
├── docs/
│   └── prototype/           # Original interactive HTML prototype
├── src/
│   ├── backend/             # FastAPI backend scaffold
│   └── frontend/            # Next.js application
│       ├── app/             # App Router pages and layout
│       ├── components/      # Reusable UI and feature components
│       ├── lib/             # Data, filters, auth, and Supabase clients
│       ├── public/          # Static assets
│       └── package.json
├── supabase/
│   └── migrations/          # Database schema, auth hook, and RLS
├── CONTRIBUTING.md         # Team contribution and review workflow
└── README.md
```

The folder structure above reflects the current development branch; some directories are not yet present on `main`.

## Architecture and implementation notes

- **Frontend:** Next.js renders the marketplace UI. Browse filters are stored in URL query parameters so views can be shared or revisited.
- **Authentication:** Supabase handles one-time-code sign-in. The authentication hook restricts new sign-ups to `@northeastern.edu` addresses; route protection and server-side session handling are implemented in the frontend.
- **Data:** The repository includes `profiles` and `listings` tables protected by Row Level Security. The browse experience currently reads sample listings from `src/frontend/lib/mock-data.ts`, not the production database.
- **API:** FastAPI is part of the planned architecture but should not be assumed to be operational yet.

For component-level guidance, see the [frontend README](src/frontend/README.md). For database setup and migration notes, see the [Supabase README](supabase/README.md).

## Design and documentation

### Figma

- [Current marketplace redesign](https://www.figma.com/design/ogZRLNukGpoXWCSgCjt8pD): updated Husky Marketplace UI explorations
- [Redesigned screen / prototype starting point](https://www.figma.com/design/ogZRLNukGpoXWCSgCjt8pD?node-id=17-3): direct link into the redesign file
- [Earlier marketplace concepts](https://www.figma.com/design/maLPrdzL4LrQCWIlZpBbME): previous desktop, mobile, and dark-mode explorations
- [UI/UX design review issue (#12)](https://github.com/Forge-NU/software-team-3/issues/12): redesign goals and tracked acceptance criteria

### Technical documentation

- [Interactive HTML prototype](docs/prototype/index.html): early product flows and visual reference
- [Frontend implementation notes](src/frontend/README.md): app structure, authentication, and remaining work
- [Database and auth setup](supabase/README.md): Supabase migration instructions
- [Project documentation](docs/README.md): design and architecture documentation directory

Design files and the HTML prototype may be ahead of the implemented Next.js application. Check the code and open issues before treating a screen as a completed feature.

## Contributing

We track work through GitHub issues and review changes through pull requests:

1. Open or claim an issue that describes the work.
2. Create a focused feature or fix branch from the team's agreed base branch.
3. Make scoped changes and use descriptive commit messages.
4. Run `npm run lint` and `npm run build` for frontend changes when applicable.
5. Open a pull request, link its issue (for example, `Closes #12`), and request at least one review before merging.

Do not commit directly to `main`, and never commit secrets or local environment files. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full team workflow.

## Team

**Project Lead:** Lauryn Gong  
**Software Team:** Allan Zhen, Arin Rakshe, Binafsha Bakhramova, Caleb Groth, Jayden Sun, Simran Sehgal  
**Semester:** Fall 2026

For questions, open a [GitHub issue](https://github.com/Forge-NU/software-team-3/issues) or contact the project lead through the team's communication channel.
