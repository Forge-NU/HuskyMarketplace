import sys
import torch
from PIL import Image, ImageOps
from transformers import CLIPModel, CLIPProcessor, pipeline

from background import load_background
from labels import GROUPS

DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
CLIP_ID = "openai/clip-vit-base-patch32"

# Starting thresholds. We'll tune these in Step 7 using the test photos.
EXPLICIT_BLOCK = 0.85   # explicit score above this -> block
EXPLICIT_FLAG = 0.50    # explicit score above this -> flag
GROUP_BLOCK = 0.60      # one "block" group above this -> block
RISKY_FLAG = 0.30       # all block + flag groups added together above this -> flag

# Load the models once, when the program starts
nsfw = pipeline("image-classification", model="Falconsai/nsfw_image_detection", device=DEVICE)
clip = CLIPModel.from_pretrained(CLIP_ID).to(DEVICE).eval()
processor = CLIPProcessor.from_pretrained(CLIP_ID)

# Every label CLIP compares against: (label, group, action)
LABELS = []
for group, (action, labels) in GROUPS.items():
    LABELS += [(label, group, action) for label in labels]
LABELS += [(label, "background", "allow") for label in load_background()]

# Turn every label into numbers once, so each photo check is fast
with torch.no_grad():
    text = processor(text=[f"a photo of {l}" for l, _, _ in LABELS], return_tensors="pt", padding=True).to(DEVICE)
    TEXT_FEATURES = clip.get_text_features(**text).pooler_output
    TEXT_FEATURES = TEXT_FEATURES / TEXT_FEATURES.norm(dim=-1, keepdim=True)


def load_clean(path):
    """Open a photo, fix its rotation, and copy only the pixels (drops GPS and other metadata)."""
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    clean = Image.new("RGB", img.size)
    clean.paste(img)
    return clean


def check_image(path):
    img = load_clean(path)

    # 1. Explicit-image model
    explicit = {r["label"]: r["score"] for r in nsfw(img)}.get("nsfw", 0.0)

    # 2. CLIP: how well the photo matches each label (all scores add up to 1)
    with torch.no_grad():
        pixels = processor(images=img, return_tensors="pt").to(DEVICE)
        feats = clip.get_image_features(**pixels).pooler_output
        feats = feats / feats.norm(dim=-1, keepdim=True)
        probs = (clip.logit_scale.exp() * feats @ TEXT_FEATURES.T).softmax(dim=-1)[0].cpu()

    # 3. Add up the scores for each group
    group_scores = {}
    for (label, group, action), p in zip(LABELS, probs.tolist()):
        group_scores[group] = group_scores.get(group, 0.0) + p

    top = sorted(zip(probs.tolist(), LABELS), reverse=True)[:5]
    result = {"explicit": round(explicit, 3), "top": [(l, g, round(p, 3)) for p, (l, g, _) in top]}

    # Groups that aren't "allow" (prohibited, dangerous, flagged)
    risky = {g: s for g, s in group_scores.items() if GROUPS.get(g, ("allow",))[0] != "allow"}
    worst = max(risky, key=risky.get)
    result["risky"] = {g: round(s, 3) for g, s in sorted(risky.items(), key=lambda x: -x[1])[:3]}

    # 4. Decide
    if explicit > EXPLICIT_BLOCK:
        return {"decision": "block", "reason": "explicit image", **result}
    if GROUPS[worst][0] == "block" and risky[worst] > GROUP_BLOCK:
        return {"decision": "block", "reason": worst, **result}
    if sum(risky.values()) > RISKY_FLAG:
        return {"decision": "flag", "reason": worst, **result}
    if explicit > EXPLICIT_FLAG:
        return {"decision": "flag", "reason": "possibly explicit", **result}
    return {"decision": "allow", "reason": None, **result}


if __name__ == "__main__":
    for path in sys.argv[1:]:
        r = check_image(path)
        print(f"{path}: {r['decision'].upper()}" + (f" ({r['reason']})" if r["reason"] else ""))
        print(f"  explicit score: {r['explicit']}")
        print("  top matches:", ", ".join(f"{l} [{g}] {p}" for l, g, p in r["top"]))
        print("  riskiest groups:", r["risky"])

