# Messaging preview behavior

This changes only the browser-local prototype. Messages are not sent to other students, and the paused messaging backend and offers are untouched.

- New messages move the conversation to the top. `updatedAt` is persisted with the demo thread so this order survives refresh. Demo threads without timestamps keep their existing order.
- Opening a thread clears its local unread flag and records `lastReadAt`. Badges and “Read on this device” refer to the viewer’s own browser state. Recipient read receipts need the messaging backend.
- The conversation header includes a clickable item photo, title, price, condition and description/area preview. It links to the demo item page, and shows an unavailable state if the item is missing.
- Outgoing messages show “Saved on this device · Not delivered.” If saving fails, the draft stays in the composer and an error is shown.
- Model tests use fixtures. Real delivery, authorization, recipient receipts and realtime ordering require the separate messaging backend work.
