"""Checks submitted listings and saves allow / flag / block.

Run it next to the app:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python3 worker.py
"""
import os
import time
from io import BytesIO

from supabase import create_client

from listing_check import moderate_listing

BUCKET = "listing-photos"
WAIT_SECONDS = 10

client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def check(listing):
    photos = [BytesIO(client.storage.from_(BUCKET).download(path)) for path in listing["photo_paths"]]
    result = moderate_listing(listing["title"] or "", listing["description"] or "", photos)
    reason = "; ".join(result["reasons"]) or None
    client.rpc("save_moderation_result", {
        "p_id": listing["id"],
        "p_decision": result["decision"],
        "p_reason": reason,
    }).execute()
    print(f"{result['decision'].upper():<6} {listing['title']!r}  {reason or ''}")


def main():
    print("Moderation worker running. Ctrl+C to stop.")
    while True:
        for listing in client.rpc("listings_to_moderate").execute().data:
            try:
                check(listing)
            except Exception as e:
                # The listing stays pending and is tried again next round.
                print(f"ERROR  {listing['id']}: {e}")
        time.sleep(WAIT_SECONDS)


if __name__ == "__main__":
    main()
