# Messaging preview behavior

This follow-up changes only the existing browser-local prototype. It does not resume the paused messaging backend, send a message to another student, or change offers processing.

- New messages move the conversation to the top. `updatedAt` is persisted with the demo thread so this order survives refresh. Old demo threads without timestamps keep their existing relative order; historical time-of-day strings are not guessed as dates.
- Opening a thread clears its local unread flag and records `lastReadAt`. Badges and “Read on this device” refer to the viewer’s own browser state. No recipient read receipt is fabricated.
- The conversation header includes a clickable item photo, title, price, condition and description/area preview. It opens the explicit demo item route. Missing records show an unavailable state.
- Outgoing messages show “Saved on this device · Not delivered.” Storage failure preserves the composer text and reports that the message was not saved.
- Model tests use isolated fixtures. No existing conversations were cleared or replaced during implementation. Real delivery, authorization, recipient receipts and realtime ordering require the separate messaging backend work.
