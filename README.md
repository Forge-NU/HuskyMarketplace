# Husky Marketplace

A campus marketplace where Northeastern students can buy, sell, and connect with other students.

Built by the Forge software team at Northeastern University, Fall 2026

**[Figma Design](https://www.figma.com/design/maLPrdzL4LrQCWIlZpBbME/Husky-Marketplace?node-id=0-1&p=f&t=ShJFy5y2M9yV52Xl-0)** · **[GitHub Repository](https://github.com/Forge-NU/HuskyMarketplace)**

## About the Project

College students are constantly moving between dorms, apartments, and co-ops. Buying furniture, textbooks, and everyday essentials can get expensive, especially when many of these items are only needed for a semester or two.

Husky Marketplace is designed to make buying and selling secondhand items easier within the Northeastern community.

Instead of searching through different platforms, students can find what they need, sell things they no longer use, and connect with other students in one place.

Our goal is to create a marketplace that is affordable, easy to use, and built around student life.

## Features

Husky Marketplace is currently under development.

| Feature | Status |
|---|---|
| Browse listings | Available with sample listings |
| Search and filters | Available; improvements in progress |
| Categories | Available |
| Listing details | Available; further improvements planned |
| Northeastern email authentication | Implemented with email codes; updates planned |
| Student profiles | In development |
| Create and manage listings | In development |
| Saved listings | Demo functionality; database integration pending |
| Messaging between students | Demo functionality; backend integration pending |
| Offers | Demo functionality; backend integration pending |
| Moving help | Planned |
| Reporting and moderation | Planned |

**Note:** The marketplace is not live yet. Current listings and some interactions use sample data while we work on connecting everything to the backend.

## Tech Stack

| Technology | What We Use It For |
|---|---|
| Next.js | Frontend application |
| React | User interface |
| TypeScript | Frontend development |
| CSS Modules | Styling |
| Supabase | Authentication and database |
| PostgreSQL | Storing user profiles and listings |
| FastAPI (Python) | Backend API development |
| Figma | UI/UX design |

## Getting Started

### Requirements

Before starting, make sure you have:

- Git
- Node.js 20.9 or later
- npm
- Access to the team's Supabase development credentials

### 1. Clone the repository

Run these commands in your terminal:

`git clone https://github.com/Forge-NU/HuskyMarketplace.git`

`cd HuskyMarketplace/src/frontend`

### 2. Install dependencies

`npm ci`

### 3. Set up environment variables

Copy `.env.example` to a new file called `.env.local`.

Add the Supabase credentials provided by the team:

`SUPABASE_URL=your-supabase-url`

`SUPABASE_ANON_KEY=your-supabase-anon-key`

Do not commit `.env.local` or share private credentials.

The shared Supabase project also needs the database migration and authentication hook configured. See [Supabase Setup](supabase/README.md).

### 4. Run the application

`npm run dev`

Open **http://localhost:3000** in your browser.

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application |
| `npm run lint` | Check the code for lint errors |
| `npm run start` | Run the production build |

Run these commands from `src/frontend`.

## Project Structure

- **`src/frontend/`**: Next.js application, pages, and components
- **`src/backend/`**: FastAPI backend development
- **`supabase/`**: Database migrations and authentication setup
- **`docs/`**: Project documentation and prototypes
- **`.github/`**: GitHub templates and project configuration

## Design

Our interface is designed to be simple, accessible, and easy for students to navigate.

The design includes the marketplace homepage, browsing and listing pages, student accounts, messaging, and other marketplace features.

**[View Husky Marketplace in Figma](https://www.figma.com/design/maLPrdzL4LrQCWIlZpBbME/Husky-Marketplace?node-id=0-1&p=f&t=ShJFy5y2M9yV52Xl-0)**

Some designs are still being developed and may not be fully functional in the application.

## Development

We use GitHub Issues to organize tasks, track progress, and coordinate development.

**[View Current Issues](https://github.com/Forge-NU/HuskyMarketplace/issues)**

When contributing:

1. Check your assigned issues before starting.
2. Work on a separate branch rather than directly on `main`.
3. Keep your changes focused on the task.
4. Test your work before submitting it for review.
5. Make sure teammates have reviewed changes before merging.
6. Update your issue as you make progress or encounter blockers.

Our priority is to build something reliable, maintainable, and consistent across the frontend and backend.

## Team

**Project Lead:** Lauryn Gong

**Software Team:**
- Allan Zhen
- Arin Rakshe
- Binafsha Bakhramova
- Caleb Groth
- Jayden Sun
- Simran Sehgal

**Organization:** Forge, Northeastern University
**Semester:** Fall 2026

---

*Husky Marketplace is a student-led project currently in development.*

