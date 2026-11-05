# Husky Marketplace Backend

FastAPI service for Husky Marketplace. This is the shared foundation from #18:
config, Supabase clients, auth, consistent errors, CORS, a health check, and
starter routers for profiles (#20) and listings (#21).

## Setup

Requires Python 3.10 or later. Run everything from `src/backend`.

```bash
cd src/backend
python3 -m venv .venv              # Windows: py -m venv .venv
source .venv/bin/activate          # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
cp .env.example .env               # Windows PowerShell: Copy-Item .env.example .env
```

Fill in `.env` with the team's Supabase URL and anon key (the same values the
frontend uses). `SUPABASE_SERVICE_ROLE_KEY` can stay blank for now.

`requirements.txt` has what the server needs to run (use it for deployment).
`requirements-dev.txt` adds pytest and httpx for local testing.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/health should return `{"status": "ok", ...}`
- Interactive API docs: http://localhost:8000/docs

## Test

```bash
pytest
```

Tests replace Supabase with a fake, so they run without credentials or network.

## Structure

```
src/backend/
├── app/
│   ├── main.py            # Creates the app, CORS, error handlers, routers
│   ├── core/
│   │   ├── config.py      # Settings from env vars / .env
│   │   ├── supabase.py    # Supabase clients (read the docstring)
│   │   ├── auth.py        # get_current_user dependency
│   │   └── errors.py      # APIError and the standard error shape
│   ├── routers/           # One file per feature area
│   └── schemas/           # Pydantic request/response models
├── tests/
├── requirements.txt
└── requirements-dev.txt
```

## How auth and data access work

1. The frontend signs the student in with Supabase.
2. It sends the session's access token to the backend as `Authorization: Bearer <token>`.
3. Routes that need a signed-in student use `Depends(get_current_user)`, which
   asks Supabase Auth to validate the token and returns the student's id and email.
4. Database queries for that student use `get_user_client(user.access_token)`,
   so the RLS policies in `supabase/migrations` still apply.

Do not use the service-role client to read or write data on behalf of a
student. It bypasses RLS, which would let the backend skip the same rules that
stop students from editing each other's profiles.

## Adding an endpoint

1. Add request/response models in `app/schemas/<feature>.py`.
2. Add the route in `app/routers/<feature>.py` (create the router and include it in `app/main.py` if it's new).
3. Raise `APIError(status, "code", "Message")` for expected failures.
4. Add a test in `tests/`.

Use plain `def` (not `async def`) for routes that call Supabase, because the
Supabase Python client is synchronous. FastAPI runs `def` routes in a thread pool.

## Errors

Every error response looks like this:

```json
{ "error": { "code": "not_found", "message": "Not Found" } }
```

Validation errors use code `validation_error` and include `details` listing the bad fields.

## Calling the backend from the frontend

Add to `src/frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Quick check from any client component:

```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
console.log(await res.json()); // { status: "ok", environment: "development" }
```

Authenticated request (using the existing Supabase browser client in `lib/`):

```ts
const { data: { session } } = await supabase.auth.getSession();
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profiles/me`, {
  headers: { Authorization: `Bearer ${session?.access_token}` },
});
```

Browser requests need the frontend's origin in `CORS_ORIGINS`. Requests made
from Next.js server code (server components, route handlers) aren't affected by CORS.

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `ENVIRONMENT` | No | `development` or `production`. Shown in `/health`. |
| `SUPABASE_URL` | Yes | Same as the frontend. |
| `SUPABASE_ANON_KEY` | Yes | Same as the frontend. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-side only. Bypasses RLS. |
| `CORS_ORIGINS` | Yes | Comma-separated exact origins. |
| `CORS_ORIGIN_REGEX` | No | For Vercel preview URLs that change per PR. |
