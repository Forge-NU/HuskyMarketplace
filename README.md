# Husky Marketplace

Husky Marketplace brings buying, selling, and student services into one campus marketplace. Whether you're furnishing an apartment, clearing out your dorm, or looking for a better deal on everyday essentials, we're building a way for Northeastern students to exchange goods with people in their own community.

Developed by the **Forge Software Team at Northeastern University, Fall 2026**

**[Figma Design](https://www.figma.com/design/maLPrdzL4LrQCWIlZpBbME/Husky-Marketplace?node-id=0-1&p=f&t=ShJFy5y2M9yV52Xl-0)** · **[GitHub Repository](https://github.com/Forge-NU/HuskyMarketplace)** · **[Project Issues](https://github.com/Forge-NU/HuskyMarketplace/issues)**

## Overview

College life comes with a lot of transitions. Students move between residence halls, off-campus apartments, and co-op locations, often buying furniture, appliances, textbooks, and other essentials they may only need for a few months.

At the same time, plenty of other students are trying to sell or give away those exact items.

Existing resale platforms aren't designed specifically for campus life. Listings are scattered across different apps and group chats, and finding someone nearby can take more effort than it should.

Husky Marketplace is our approach to solving that problem. We're building a marketplace where Northeastern students can discover secondhand goods, sell items they no longer need, and connect with other students. We're also exploring services such as moving help to make the platform useful beyond buying and selling.

## Features & Development Status

Husky Marketplace is currently in development. We've built the initial Next.js application and expanded the frontend with additional marketplace pages. The team is now working on connecting those experiences to real user accounts and listings.

| Feature | Current Status |
|---|---|
| Marketplace browsing | Working with sample listings and categories |
| Search, filtering & sorting | Basic search and filtering available; improvements underway |
| Listing details | Frontend pages implemented; additional functionality in progress |
| Northeastern authentication | Supabase email-code sign-in implemented; email/password login planned |
| Student profiles | Frontend developed; database integration pending |
| Creating & managing listings | Frontend demo available; backend integration pending |
| Saved listings | Browser-based demo; persistent storage pending |
| Student messaging | Interactive demo; not yet connected between users |
| Offers | Frontend demo; backend support planned |
| Moving help | Interface developed; full workflow planned |
| Reporting & moderation | Planned |

**Note:** Husky Marketplace is not publicly launched. The current interface uses sample listings and browser-stored data for several features. These are not real student submissions or conversations. Some newer screens are also still being integrated into the main application.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16, React 19 | Application pages and user interface |
| Language | TypeScript | Frontend development |
| Styling | CSS Modules, CSS | Component styling and shared design elements |
| Authentication | Supabase Auth, `@supabase/ssr` | Sign-in and user sessions |
| Database | Supabase PostgreSQL | User profiles and marketplace listings |
| Database Security | Row Level Security (RLS) | Controls access to stored data |
| Backend | FastAPI, Python | Planned API and server-side functionality |
| Design | Figma | UI/UX design and prototypes |

## Getting Started

### Prerequisites

Before running the project locally, you'll need:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 20.9 or later
- npm
- Access to the team's Supabase development credentials

### 1. Clone the Repository

```bash
git clone https://github.com/Forge-NU/HuskyMarketplace.git
cd HuskyMarketplace
```

The Next.js application is located in `src/frontend`.

```bash
cd src/frontend
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Supabase

Copy the environment template:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Add the Supabase credentials provided by the team:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

Never commit `.env.local` or private API keys to GitHub. The Supabase `service_role` key must not be included in frontend code.

The shared Supabase project must also have the database migrations applied and the **Before User Created** authentication hook configured.

See the [Supabase README](supabase/README.md) for setup details.

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need a working Supabase connection to sign in and access the authenticated marketplace.

### Available Commands

Run these inside `src/frontend`:

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Check for lint errors |
| `npm run build` | Build the application |
| `npm run start` | Run the production build |

An automated test script has not yet been configured.

## Repository Structure

```text
HuskyMarketplace/
├── .github/                 # GitHub templates and configuration
├── docs/
│   └── prototype/           # Original interactive prototype
├── src/
│   ├── backend/             # FastAPI backend development
│   └── frontend/            # Next.js application
│       ├── app/             # Pages, routes, and layouts
│       ├── components/      # UI components
│       ├── lib/             # Authentication, data, and utilities
│       ├── public/          # Static assets
│       └── package.json
├── supabase/
│   └── migrations/          # Database tables and security policies
├── CONTRIBUTING.md
└── README.md
```

## How It Works

### Frontend

The frontend is built with Next.js, React, and TypeScript.

It includes marketplace browsing, categories, listing details, and an expanding set of pages for student accounts, selling, saved items, and messaging.

The original browse experience supports URL-based filters, while the redesigned interface adds more of the pages and interactions needed for the full marketplace.

Components and their styles are organized separately to make the frontend easier to maintain as the team adds features.

### Authentication

Supabase handles sign-in and user sessions.

The current implementation uses email verification codes. We're working toward a signup process that verifies a Northeastern email address, followed by email-and-password login for returning users.

The database setup includes a hook designed to restrict new registrations to `@northeastern.edu` addresses. This checks the email domain but does not independently verify current enrollment.

### Listings & Database

The Supabase database includes initial tables for student profiles and marketplace listings, with Row Level Security policies to control access.

The current frontend still uses sample listings and local browser data for several interactions. We're working on connecting those pages to stored records so students can create listings, save items, and manage their accounts across sessions.

The team also plans to use FastAPI for backend functionality. The backend is still in development.

### Safety & Moderation

We're planning features for reporting listings, reviewing prohibited items, and improving account verification.

These will help us manage student-generated listings as the marketplace develops.

## Design

We want Husky Marketplace to feel like a website made for Northeastern students, rather than another general resale platform.

The design focuses on clear navigation, listing photos, easy-to-browse categories, and straightforward ways to buy, sell, and manage an account.

Our Figma includes designs for the homepage, listing pages, profiles, messaging, offers, and other features we're developing.

**[View the Husky Marketplace Figma Design](https://www.figma.com/design/maLPrdzL4LrQCWIlZpBbME/Husky-Marketplace?node-id=0-1&p=f&t=ShJFy5y2M9yV52Xl-0)**

Not every screen or interaction shown in Figma is fully implemented yet.

## What's Next

Our main focus is getting the core buying and selling experience working with real data.

This includes:

- **Accounts:** Finishing signup, verification, and returning-user login.
- **Listings:** Connecting posting, editing, and browsing to the database.
- **Search:** Improving filters and sorting so students can find relevant items more easily.
- **Saved items & profiles:** Storing user information and saved listings across sessions.
- **Testing & deployment:** Checking how the frontend and backend work together before launch.

Messaging, offers, moving help, and additional safety features are also part of the longer-term plan.

We track tasks, responsibilities, and progress through [GitHub Issues](https://github.com/Forge-NU/HuskyMarketplace/issues).

## Contributing

Husky Marketplace is developed collaboratively by the Forge software team.

Before starting work, check the GitHub issues for your assigned tasks and their requirements.

When making changes:

1. Create a separate branch rather than working directly on `main`.
2. Keep your changes focused and follow the existing project structure.
3. Test your work locally. For frontend changes, run `npm run lint` and `npm run build` when applicable.
4. Have your changes reviewed before merging.
5. Update the relevant issue with progress, questions, or blockers.

For more details, read [CONTRIBUTING.md](CONTRIBUTING.md).

## Documentation

- [Frontend README](src/frontend/README.md): Frontend setup and implementation notes
- [Supabase README](supabase/README.md): Database and authentication setup
- [Project Documentation](docs/README.md): Design and technical notes
- [Interactive Prototype](docs/prototype/index.html): Earlier version of the marketplace interface

## Team

**Project Lead:** Lauryn Gong

**Software Team:** Allan Zhen, Arin Rakshe, Binafsha Bakhramova, Caleb Groth, Jayden Sun, Simran Sehgal

**Organization:** Forge at Northeastern University

**Semester:** Fall 2026
