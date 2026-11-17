from transformers import pipeline

# Zero-shot text classifier: like CLIP for images, it scores how well the listing
# matches each plain-English description. No word list and no training needed.
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# description -> group. Groups match TEXT_GROUPS in text_check.py.
LABELS = {
    "selling drugs, pills, or drug paraphernalia": "drugs",
    "selling vapes, cigarettes, or nicotine products": "tobacco_vapes",
    "selling alcohol": "alcohol",
    "selling a gun, knife, or other weapon": "weapons",
    "selling fireworks or explosives": "explosives_hazmat",
    "selling tickets, IDs, or gift cards": "ids_cards_tickets",
    "selling sexual content or services": "adult",
    # Many specific "normal" labels, so innocent listings have somewhere to land.
    "selling clothing, shoes, or accessories": "allow",
    "selling furniture or home goods": "allow",
    "selling electronics or a phone or laptop": "allow",
    "selling textbooks, notebooks, or school supplies": "allow",
    "selling kitchen items or dorm supplies": "allow",
    "selling sports, fitness, or outdoor gear": "allow",
    "selling games, toys, or hobby items": "allow",
    "offering a service like tutoring or moving help": "allow",
}


def score_text(text):
    """Return {group: total score}, highest first. Scores across all labels add up to 1."""
    result = classifier(text, list(LABELS), hypothesis_template="This listing is {}.")
    totals = {}
    for label, score in zip(result["labels"], result["scores"]):
        group = LABELS[label]
        totals[group] = totals.get(group, 0) + score
    return dict(sorted(totals.items(), key=lambda kv: -kv[1]))


if __name__ == "__main__":
    examples = [
        "Selling dope, hmu 🍃",
        "Dope vintage jacket, size M",
        "Pack of cigs, barely opened",
        "IKEA desk lamp, works great",
        "Bullet journal, never used",
        "Party favors for the weekend 💊",
    ]
    for text in examples:
        top = [(g, round(s, 3)) for g, s in list(score_text(text).items())[:2]]
        print(f"{text!r:40} -> {top}")

