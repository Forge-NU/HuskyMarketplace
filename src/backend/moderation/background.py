from transformers import AutoConfig

# ImageNet object names that overlap our prohibited or flagged groups.
# Keep them out of the background, or a gun photo would match "revolver"
# as a normal item and get allowed.
EXCLUDE = {
    "assault rifle", "rifle", "revolver", "holster", "missile", "projectile",
    "cannon", "tank", "bow", "scabbard", "bulletproof vest", "chain mail",
    "beer bottle", "beer glass", "wine bottle", "red wine", "whiskey jug",
    "pill bottle", "syringe", "pillow", "quilt", "sleeping bag",
}

def load_background():
    """ImageNet's 1,000 everyday object names, minus animals and the overlaps above."""
    id2label = AutoConfig.from_pretrained("google/vit-base-patch16-224").id2label
    names = [id2label[i].split(",")[0] for i in range(1000)]
    # Indices 0-397 are animals. Live animals are flagged by our policy, so leave them out.
    objects = [n for i, n in enumerate(names) if i >= 398 and n not in EXCLUDE]
    return list(dict.fromkeys(objects))  # ImageNet repeats a couple of names; drop repeats

