from text_cases import CASES
from text_check import check_text

CAUGHT = {"flag", "block"}

allowed = [(e, t) for e, t in CASES if e == "allow"]
prohibited = [(e, t) for e, t in CASES if e in CAUGHT]

false_alarms, misses, exact = [], [], 0

for expected, text in CASES:
    r = check_text(text)
    got = r["decision"]
    # Correct = allowed text passes, and prohibited text gets stopped (flag or block both count)
    correct = (got == "allow") == (expected == "allow")
    exact += got == expected
    if not correct:
        (false_alarms if expected == "allow" else misses).append((text, got, r["reason"]))
    reason = f"({r['reason']})" if r["reason"] else ""
    print(f"{'✓' if correct else '✗'} expected {expected:<5}  got {got:<5} {reason:<22} {text}")

print("\n=== Summary ===")
print(f"Prohibited caught: {len(prohibited) - len(misses)}/{len(prohibited)}")
print(f"Allowed passed:    {len(allowed) - len(false_alarms)}/{len(allowed)} ({len(false_alarms)} false alarms)")
print(f"Exact match (allow/flag/block all right): {exact}/{len(CASES)}")

if misses:
    print("\nMissed (should be caught):")
    for text, got, _ in misses:
        print(f"  {text}")
if false_alarms:
    print("\nFalse alarms (should be allowed):")
    for text, got, reason in false_alarms:
        print(f"  {text} -> {got} ({reason})")

