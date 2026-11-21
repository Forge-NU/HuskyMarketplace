from labels import GROUPS
from moderate import check_image
from text_check import check_text


def _banned_photo(img):
    """A flagged photo whose closest match is a banned category (weapons, drugs, ...)."""
    return img["decision"] == "flag" and (
        img["reason"] == "possibly explicit" or GROUPS.get(img["reason"], ("allow",))[0] == "block"
    )


def moderate_listing(title, description, photos):
    """Check a listing's text and photos together. Returns allow / flag / block with reasons."""
    text = check_text(f"{title}\n{description}")
    images = [check_image(p) for p in photos]

    reasons = []
    if text["decision"] != "allow":
        terms = ", ".join(m["term"] for m in text["matches"])
        reasons.append(f"text: {text['reason']} ({terms})")
    for i, img in enumerate(images, start=1):
        if img["decision"] != "allow":
            reasons.append(f"photo {i}: {img['reason']}")

    photo_block = any(img["decision"] == "block" for img in images)
    photo_flag = any(img["decision"] == "flag" for img in images)
    photo_banned = any(_banned_photo(img) for img in images)

    # Block when one check is sure, or when both checks point at a banned item:
    # a strong word with any suspicious photo, or any word hit with a photo that looks banned.
    if (photo_block
            or (text["decision"] == "block" and photo_flag)
            or (text["decision"] != "allow" and photo_banned)):
        decision = "block"
    # Any word bank hit goes to a person, as the policy says.
    elif text["decision"] != "allow" or photo_flag:
        decision = "flag"
    else:
        decision = "allow"

    return {"decision": decision, "reasons": reasons, "text": text, "photos": images}

