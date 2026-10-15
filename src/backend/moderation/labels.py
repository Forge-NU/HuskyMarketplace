# Each group: (action, [labels]).  "a photo of " is added in front of each label later.
# block = clearly not allowed, flag = send to human review, allow = normal marketplace items

GROUPS = {
    # ---------- Prohibited items (from the prohibited-items policy) ----------
    "weapons": ("block", [
        "a handgun", "a rifle or shotgun", "ammunition or bullets", "gun parts or a gun magazine",
        "a combat knife or switchblade", "brass knuckles", "a taser or stun gun",
        "a can of pepper spray", "a sword or machete",
        "a pistol", "a firearm on a table", "a gun in a holster",
    ]),
    "replica_weapons": ("flag", [
        "an airsoft or BB gun", "a toy gun",
    ]),
    "explosives_hazmat": ("block", [
        "fireworks", "firecrackers", "an explosive device",
        "a propane tank or gas canister", "a bottle of chemicals or poison",
        "fireworks or firecracker packaging",
    ]),
    "tobacco_vapes": ("block", [
        "a vape pen or e-cigarette", "a disposable vape", "bottles of vape juice",
        "a pack of cigarettes", "cigars", "a hookah", "nicotine pouches",
        "a box mod vape device", "a vape packaging box",
    ]),
    "alcohol": ("block", [
        "a bottle of beer", "cans of beer or hard seltzer", "a bottle of wine",
        "a bottle of liquor", "a case of alcoholic drinks",
    ]),
    "drugs": ("block", [
        "marijuana buds", "cannabis edibles", "loose pills or tablets",
        "a prescription pill bottle", "a syringe or needle", "a bong or glass pipe",
        "white powder drugs",
    ]),
    "ids_cards_tickets": ("block", [
        "a driver's license or ID card", "a student ID card", "a passport",
        "a credit card or debit card", "a gift card", "an event or concert ticket",
        "a sports game ticket",
    ]),
    "policy_restricted": ("flag", [
        "a used mattress", "used pillows or bedding", "a live pet dog or cat",
        "a pet fish, bird, or reptile", "homemade food or baked goods",
        "contact lens boxes", "prescription medication boxes", "cash or banknotes",
    ]),

    # ---------- Dangerous or harmful images ----------
    "gore_violence": ("block", [
        "graphic violence", "blood and gore", "a bloody wound or injury",
        "a dead body", "a dead animal", "people fighting",
        "a person pointing a weapon at someone",
    ]),
    "self_harm": ("block", [
        "self-harm cuts on skin",
    ]),
    "hate_symbols": ("block", [
        "a swastika or Nazi symbol", "a hate symbol", "Ku Klux Klan imagery",
    ]),
    "sexual_backup": ("flag", [
        "nudity", "sexually explicit content", "lingerie or underwear modeling",
    ]),

    # ---------- Privacy, scams, and off-topic ----------
    "privacy": ("flag", [
        "a document with personal information", "a car license plate",
        "a young child", "a QR code",
    ]),
    "off_topic_spam": ("flag", [
        "a screenshot of a phone or website", "a meme with text",
        "a cartoon or drawing", "a photo of a computer screen",
        "a blank or very blurry image", "a page of text",
    ]),

    # ---------- Allowed (from the app's categories) ----------
    "textbooks_school": ("allow", [
        "a textbook", "a stack of books", "notebooks or school supplies", "a calculator",
    ]),
    "furniture": ("allow", [
        "a desk", "a desk chair or office chair", "a bookshelf", "a dresser",
        "a bed frame", "a sofa or couch", "a table", "a rug", "a lamp",
        "a mirror", "storage drawers or a rolling cart",
    ]),
    "dorm_kitchen": ("allow", [
        "a mini fridge", "a microwave", "a rice cooker", "a kettle or coffee maker",
        "a fan", "a laundry hamper", "pots and pans", "dishes and utensils",
        "a kitchen knife set", "a shower caddy", "a trash can", "clothes hangers",
        "sealed packaged snacks", "a glass bottle of juice or kombucha", "a bottle of soda",
    ]),
    "electronics": ("allow", [
        "headphones or earbuds", "a laptop", "a computer monitor", "a keyboard and mouse",
        "a smartphone", "a tablet", "a speaker", "a TV", "a video game console",
        "a game controller", "a camera", "chargers and cables", "a printer",
    ]),
    "clothing": ("allow", [
        "a jacket or coat", "a hoodie or sweatshirt", "a t-shirt", "jeans or pants",
        "shoes or sneakers", "a dress", "a backpack", "a bag or purse", "a hat",
        "jewelry or a watch", "a person wearing clothes",
    ]),
    "other_goods": ("allow", [
        "a bicycle", "an electric scooter", "sports equipment", "a yoga mat",
        "gym weights", "a guitar or musical instrument", "a board game or playing cards",
        "a toy or stuffed animal", "a nerf blaster", "a fire extinguisher", "a houseplant", "a poster or wall art",
        "string lights or decorations", "a suitcase", "moving boxes", "an umbrella",
    ]),
    "services": ("allow", [
        "a person carrying boxes", "a car or moving van", "a person tutoring",
        "a haircut", "a professional headshot",
    ]),
    "catch_all": ("allow", [
        "an ordinary household item", "a random everyday object",
        "a room interior", "a product on a table",
    ]),
}

