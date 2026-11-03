import re
import unicodedata

# Each group: (action, [terms]). Terms are regular expressions matched as whole words,
# case-insensitive. Keep groups in sync with labels.py and the prohibited-items policy.
#
# "block" groups hold STRONG words that almost always mean the prohibited thing.
# "*_maybe" groups hold AMBIGUOUS words that are often innocent ("wine red", "bullet journal"),
# so they only flag the listing for a human instead of blocking it.
TEXT_GROUPS = {
    "weapons": ("block", [
        r"glock", r"handguns?", r"shotguns?", r"ar-?15", r"ammo", r"ammunition",
        r"switchblades?", r"brass knuckles?", r"tasers?", r"stun guns?", r"pepper spray",
        r"machetes?", r"firearms?",
    ]),
    "weapons_maybe": ("flag", [
        r"pistols?", r"rifles?", r"bullets?",
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
        r"puff ?bar", r"cigarettes?", r"hookah", r"zyns?", r"nicotine", r"snus",
        r"vape juice", r"e-?liquid",
    ]),
    "tobacco_maybe": ("flag", [
        r"cigars?", r"nic (pods?|salts?)",
    ]),
    "alcohol": ("block", [
        r"vodka", r"whiske?y", r"tequila", r"liquor", r"hard seltzer", r"white claw", r"booze",
    ]),
    "alcohol_maybe": ("flag", [
        r"beers?", r"wine", r"alcohol",
    ]),
    "drugs": ("block", [
        r"weed", r"marijuana", r"cannabis", r"thc", r"cbd", r"dab pens?", r"shrooms",
        r"adderall", r"xanax", r"percocet", r"bongs?", r"cocaine", r"mdma", r"lsd",
        r"ketamine", r"delta-?8", r"percs?", r"xans?", r"pre-?rolls?",
    ]),
    "drugs_maybe": ("flag", [
        r"edibles?", r"carts?", r"oxy", r"molly", r"prescription", r"zaza", r"lean",
    ]),
    "ids_cards_tickets": ("block", [
        r"tickets?", r"fake ids?", r"passports?", r"driver'?s licen[cs]e", r"student ids?",
        r"gift cards?", r"meal swipes?", r"dining dollars", r"husky ?cards?", r"parking permits?",
    ]),
    "adult": ("block", [
        r"onlyfans", r"nudes?", r"adult services",
    ]),
    "adult_maybe": ("flag", [
        r"escorts?",
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
    r"bullet (journals?|points?)", r"ticket to ride", r"beer pong", r"wine[ -](red|colou?red)",
    r"prescription (glasses|sunglasses|eyeglasses)", r"ford escort", r"edible arrangements?",
    r"pistol squats?", r"(ink|printer|toner) (carts?|cartridges?)", r"cigar box(es)?",
    r"rifle paper( co)?", r"lean (cuisine|meat|protein|muscle)",
]

# Emojis can't use word boundaries, so they're matched separately. They only ever flag.
EMOJI_GROUPS = {
    "drugs_maybe": ("flag", ["🍃", "🌿", "🍁", "💨", "💊", "🍄", "🔌"]),
    "weapons_maybe": ("flag", ["🔫"]),
    "alcohol_maybe": ("flag", ["🍺", "🍻", "🍷", "🥃", "🍾", "🍸"]),
    "tobacco_maybe": ("flag", ["🚬"]),
}

# Look-alike letters from other alphabets (Cyrillic, Greek) -> the normal letter they imitate.
LOOKALIKES = str.maketrans({
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i",
    "ј": "j", "ѕ": "s", "α": "a", "ο": "o", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "τ": "t",
})
# Numbers and symbols used in place of letters: "v4pe", "gl0ck", "w33d".
LEET = str.maketrans({"4": "a", "@": "a", "3": "e", "1": "i", "!": "i", "0": "o", "$": "s", "5": "s", "7": "t"})

_SAFE = re.compile(r"\b(" + "|".join(SAFE_PHRASES) + r")\b", re.IGNORECASE)
_PATTERNS = {
    group: (action, re.compile(r"\b(" + "|".join(terms) + r")\b", re.IGNORECASE))
    for group, (action, terms) in TEXT_GROUPS.items()
}


def _unleet(word):
    # Only swap inside words that mix letters and numbers, so prices ("$5"),
    # phone numbers, and model numbers ("TI-84") stay as they are.
    if re.search(r"[a-z]", word) and re.search(r"[0-9@$!]", word):
        return word.translate(LEET)
    return word


def normalize(text):
    """Undo common disguises so "V.A.P.E", "v4pe", "vaaape" and "vаpe" all read as "vape"."""
    text = unicodedata.normalize("NFKC", text).translate(LOOKALIKES).lower()
    text = re.sub(r"[a-z0-9@$!]+", lambda m: _unleet(m.group(0)), text)
    # Join single letters split up by dots, dashes, or spaces: "a-d-d-e-r-a-l-l" -> "adderall"
    text = re.sub(r"\b(?:[a-z][.\-_* ]){2,}[a-z]\b", lambda m: re.sub(r"[.\-_* ]", "", m.group(0)), text)
    # Squash letters repeated 3+ times: "vaaaape" -> "vape"
    return re.sub(r"([a-z])\1{2,}", r"\1", text)


def _find_terms(text, matches):
    cleaned = _SAFE.sub(" ", text)
    for group, (action, pattern) in _PATTERNS.items():
        for m in pattern.finditer(cleaned):
            matches.append({"group": group, "action": action, "term": m.group(0)})


def check_text(text):
    """Scan listing text for prohibited terms. Returns allow / flag / block, like check_image."""
    matches = []
    _find_terms(text, matches)            # the text as written
    normalized = normalize(text)
    if normalized != text.lower():
        _find_terms(normalized, matches)  # the text with disguises undone
    for group, (action, emojis) in EMOJI_GROUPS.items():
        matches += [{"group": group, "action": action, "term": e} for e in emojis if e in text]

    # The same word can be found in both passes; keep one copy of each.
    unique = list({(m["group"], m["term"].lower()): m for m in matches}.values())

    for action in ("block", "flag"):
        hits = [m for m in unique if m["action"] == action]
        if hits:
            return {"decision": action, "reason": hits[0]["group"], "matches": unique}
    return {"decision": "allow", "reason": None, "matches": unique}

