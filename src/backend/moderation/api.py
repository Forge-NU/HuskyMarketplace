from io import BytesIO

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import UnidentifiedImageError

from moderate import check_image
from text_check import check_text

MAX_PHOTOS = 5
SEVERITY = {"allow": 0, "flag": 1, "block": 2}

app = FastAPI(title="Husky Marketplace moderation")

# Let the Next.js dev server (localhost:3000) call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/moderate-listing")
async def moderate_listing(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form(""),
    price: str = Form(""),
    photos: list[UploadFile] = File(default=[]),
):
    """Check a listing's text and photos. The worst result wins: block > flag > allow."""
    if len(photos) > MAX_PHOTOS:
        raise HTTPException(400, f"Up to {MAX_PHOTOS} photos per listing.")

    text = check_text(f"{title}\n{description}")

    photo_results = []
    for photo in photos:
        try:
            result = check_image(BytesIO(await photo.read()))
        except UnidentifiedImageError:
            raise HTTPException(400, f"{photo.filename} isn't an image we can read (try JPEG, PNG, or WebP).")
        photo_results.append({"filename": photo.filename, **result})

    checks = [("text", text)] + [(p["filename"], p) for p in photo_results]
    worst = max((c for _, c in checks), key=lambda c: SEVERITY[c["decision"]])

    reasons = [
        f"{source}: {c['reason']}" for source, c in checks
        if c["decision"] != "allow"
    ]

    return {
        "decision": worst["decision"],
        "reasons": reasons,
        "text": text,
        "photos": photo_results,
        "listing": {"title": title, "category": category, "price": price},
    }

