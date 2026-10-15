from pathlib import Path

from moderate import check_image

IMAGE_TYPES = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic"}
FOLDERS = {"allowed": "should be ALLOWED", "prohibited": "should be FLAGGED or BLOCKED"}

results = {"allowed": [], "prohibited": []}

for folder, expected in FOLDERS.items():
    print(f"\n=== {folder}/ ({expected}) ===")
    for path in sorted(Path("test_images", folder).iterdir()):
        if path.suffix.lower() not in IMAGE_TYPES:
            continue  # skips .DS_Store and anything that isn't a photo
        r = check_image(path)
        correct = (r["decision"] == "allow") == (folder == "allowed")
        results[folder].append((path.name, r, correct))
        top_label, top_group, top_score = r["top"][0]
        reason = f" ({r['reason']})" if r["reason"] else ""
        print(f"{'✓' if correct else '✗'} {path.name:<28} {r['decision'].upper():<6}{reason:<24} top: {top_label} [{top_group}] {top_score}")

allowed, prohibited = results["allowed"], results["prohibited"]
passed = sum(c for _, _, c in allowed)
caught = sum(c for _, _, c in prohibited)
blocked = sum(r["decision"] == "block" for _, r, _ in prohibited)

print("\n=== Summary ===")
print(f"Prohibited caught: {caught}/{len(prohibited)} ({blocked} blocked, {caught - blocked} flagged)")
print(f"Allowed passed:    {passed}/{len(allowed)} ({len(allowed) - passed} false alarms)")

misses = [n for n, _, c in prohibited if not c]
false_alarms = [f"{n} -> {r['decision']} ({r['reason']})" for n, r, c in allowed if not c]
if misses:
    print("\nMissed (prohibited but allowed):", ", ".join(misses))
if false_alarms:
    print("\nFalse alarms (allowed but flagged/blocked):")
    for line in false_alarms:
        print("  " + line)

