# Husky Marketplace — standalone visual prototype

This directory contains the approved standalone HTML/CSS/JavaScript prototype. It is not the production Next.js application.

## Run locally

From the repository root:

```powershell
node docs/photographic-ui/dev-server.js
```

Open http://127.0.0.1:5500/ (redirects to home.html).

## Layout

- `home.html`: prototype homepage; `index.html`: compatibility redirect.
- `browse.html`, `listing.html`, `seller.html`, `saved.html`: marketplace discovery.
- `sell.html`, `messages.html`, `moving.html`: interactive demo flows.
- `login.html`, `signup.html`, `verify.html`, `account.html`: demo account flows.
- `terms.html`, `privacy.html`, `safety.html`: draft informational policies.
- `assets/css/`: shared styles; `assets/js/`: browser scripts; `assets/images/`: future local imagery.
- `dev-server.js`: development-only HTTP server.

## Important limitations

This prototype uses browser-local data and fictional conversations and offers. It is not connected to production Supabase services, real moderation enforcement, or payment processing. Auth and policy text remain provisional.

## Production integration

Do not deploy this folder as the Next.js application. Port the reviewed components and flows into `src/frontend` alongside the team's existing auth implementation.
