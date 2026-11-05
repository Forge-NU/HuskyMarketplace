# Listing integration status

Related to #21. The backend proposal and API decision are tracked in [#33](https://github.com/Forge-NU/HuskyMarketplace/issues/33).

The frontend currently expects a version check and draft, photo attachment, submission and deletion operations. These are proposed adapter calls, not deployed APIs. The team still needs to choose the interface around Allan’s FastAPI moderation endpoint and @S1LynKz’s photo storage work. Update the adapter to that agreement before enabling publishing.

The required lifecycle is draft → photos → pending review → approved or blocked by the trusted backend. Ownership and visibility must be enforced by backend authorization and RLS.

Browse shows loading, empty and error states. When live listings are unavailable, a separate link opens the existing sample marketplace; failed requests do not replace live records with samples. Creation, uploads, editing, deletion and moderation still need authenticated end-to-end testing after the backend is connected.
