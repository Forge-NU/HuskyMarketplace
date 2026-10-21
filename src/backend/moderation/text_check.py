import re

# Each group: (action, [terms]). Terms are regular expressions matched as whole words,
# case-insensitive. Keep groups in sync with labels.py and the prohibited-items policy.
TEXT_GROUPS = {
    "weapons": ("block", [
        r"glock", r"pistols?", r"handguns?", r"rifles?", r"shotguns?", r"ar-?15", r"ammo",
        r"ammunition", r"bullets?", r"switchblades?", r"brass knuckles?", r"tasers?",
        r"stun guns?", r"pepper spray", r"machetes?", r"firearms?",
    ]),
    "replica_weapons": ("flag", [
        r"airsoft", r"bb guns?", r"toy guns?", r"replica", r"guns?", r"bombs?",
    ]),
    "explosives_hazmat": ("block", [
        r"fireworks?", r"firecrackers?", r"explosives?", r"m-?80s?",
        r"pipe bombs?", r"grenades?", r"dynamite", r"detonators?",
    ]),
    "tobacco_vapes": ("block", [
        r"vapes?", r"vaping", r"e-?cigs?", r"e-?cigarettes?", r"juul", r"elf ?bar", r"geek ?bar",
        r"puff ?bar", r"cigarettes?", r"cigars?", r"hookah", r"zyns?", r"nicotine", r"snus",
        r"vape juice", r"e-?liquid",
    ]),
    "alcohol": ("block", [
        r"beers?", r"wine", r"vodka", r"whiske?y", r"tequila", r"liquor", r"alcohol",
        r"hard seltzer", r"white claw", r"booze",
    ]),
    "drugs": ("block", [
        r"weed", r"marijuana", r"cannabis", r"thc", r"cbd", r"edibles?", r"dab pens?", r"carts?",
        r"shrooms", r"adderall", r"xanax", r"oxy", r"percocet", r"prescription", r"bongs?",
        r"cocaine", r"molly", r"mdma", r"lsd", r"ketamine", r"delta-?8",
    ]),
    "ids_cards_tickets": ("block", [
        r"tickets?", r"fake ids?", r"passports?", r"driver'?s licen[cs]e", r"student ids?",
        r"gift cards?", r"meal swipes?", r"dining dollars", r"husky ?cards?", r"parking permits?",
    ]),
    "adult": ("block", [
        r"onlyfans", r"nudes?", r"escort", r"adult services",
    ]),
    "policy_restricted": ("flag", [
        r"mattress(es)?", r"pillows?", r"bedding", r"pupp(y|ies)", r"kittens?", r"homemade",
        r"baked goods", r"contact lens(es)?", r"property of northeastern", r"university property",
    ]),
    "academic_integrity": ("flag", [
        r"answer keys?", r"exam answers", r"test banks?", r"write your (essay|paper)",
        r"do your homework",
    ]),
    "off_platform_contact": ("flag", [
        r"\d{3}[\s.-]?\d{3}[\s.-]?\d{4}",                   # phone numbers
        r"[\w.+-]+@[\w-]+\.[\w.]+",                         # email addresses
        r"whatsapp", r"telegram", r"text me at", r"dm me on",
    ]),
}

# Harmless phrases that contain a banned word. They're removed before matching,
# so "hot glue gun" or "wine glass" doesn't trip the filter.
SAFE_PHRASES = [
    r"glue guns?", r"heat guns?", r"staple guns?", r"nail guns?", r"water guns?",
    r"nerf (guns?|blasters?)", r"massage guns?", r"gun ?metal", r"top gun",
    r"wine (glass(es)?|racks?|openers?)", r"rubbing alcohol", r"alcohol wipes?",
    r"cat trees?", r"root beer", r"ginger beer", r"shopping carts?", r"go-?karts?",
    r"bath bombs?", r"the bomb", r"bomb pops?", r"seed bombs?", r"photo ?bomb(ed|ing)?",
]

_SAFE = re.compile(r"\b(" + "|".join(SAFE_PHRASES) + r")\b", re.IGNORECASE)
_PATTERNS = {
    group: (action, re.compile(r"\b(" + "|".join(terms) + r")\b", re.IGNORECASE))
    for group, (action, terms) in TEXT_GROUPS.items()
}


def check_text(text):
    """Scan listing text for prohibited terms. Returns allow / flag / block, like check_image."""
    cleaned = _SAFE.sub(" ", text)
    matches = []
    for group, (action, pattern) in _PATTERNS.items():
        for m in pattern.finditer(cleaned):
            matches.append({"group": group, "action": action, "term": m.group(0)})

    for action in ("block", "flag"):
        hits = [m for m in matches if m["action"] == action]
        if hits:
            return {"decision": action, "reason": hits[0]["group"], "matches": matches}
    return {"decision": "allow", "reason": None, "matches": matches}

