# Example listings with the answer the text check SHOULD give.
# "allow" = fine, "flag" = send to human review, "block" = not allowed.
# Add a row whenever you find a listing the check gets wrong.

CASES = [
    # ---------- Normal listings (should be allowed) ----------
    ("allow", "IKEA desk, white, great condition"),
    ("allow", "Mini fridge 3.1 cu ft, works great"),
    ("allow", "TI-84 Plus CE calculator"),
    ("allow", "Calculus: Early Transcendentals, 8th edition"),
    ("allow", "North Face winter coat, size L"),
    ("allow", "Kitchen knife set with block"),
    ("allow", "Fire extinguisher, never used"),
    ("allow", "Moving help, $20/hr, I have a car"),
    ("allow", "Calc 1 and 2 tutoring at Snell"),
    ("allow", "Weekly pill organizer"),
    ("allow", "Folding shopping cart for groceries"),
    ("allow", "Pot for cooking pasta"),
    ("allow", "Shot glasses set"),

    # ---------- Normal listings that contain a "risky" word ----------
    ("allow", "Nerf gun barely used"),
    ("allow", "Hot glue gun and glue sticks"),
    ("allow", "Wine glasses, set of 4"),
    ("allow", "Lush bath bombs, unopened"),
    ("allow", "Bomber jacket, size M"),
    ("allow", "This jacket is the bomb"),
    ("allow", "Bullet journal, unused"),
    ("allow", "Ticket to Ride board game"),
    ("allow", "Prescription sunglasses, Ray-Ban"),
    ("allow", "Beer pong table"),
    ("allow", "Wine red sweater, size M"),
    ("allow", "Ford Escort 2009, runs well"),
    ("allow", "Edible Arrangements gift box"),
    ("allow", "Pistol squat resistance bands"),
    ("allow", "Printer ink carts, HP 63"),
    ("allow", "Cigar box guitar, handmade"),
    ("allow", "Molly the stuffed bear"),
    ("allow", "Rifle Paper Co. planner"),

    # ---------- Clearly prohibited (should be blocked) ----------
    ("block", "Glock 19 with two mags"),
    ("block", "Selling my Elf Bar vapes"),
    ("block", "Juul pods, mint"),
    ("block", "Celtics tickets x2"),
    ("block", "Adderall 20mg, 10 pills"),
    ("block", "Fake ID, very realistic"),
    ("block", "Bottle of Tito's vodka, unopened"),
    ("block", "Fireworks for 4th of July"),
    ("block", "Meal swipes $5 each"),
    ("block", "Brass knuckles"),
    ("block", "Pipe bomb"),
    ("block", "Glass bong, barely used"),

    # ---------- Gray areas (should be flagged for review) ----------
    ("flag", "Toy gun for kids"),
    ("flag", "Desk lamp, text me 617-555-1234"),
    ("flag", "Twin XL mattress topper"),
    ("flag", "Puppy needs a new home"),
    ("flag", "Homemade cookies, $5 a dozen"),
    ("flag", "Answer key for the CS 2500 final"),
    ("flag", "bomb"),

    # ---------- Disguised spellings, slang, and emojis ----------
    ("block", "v4pe pods"),
    ("block", "V.A.P.E pen"),
    ("block", "gl0ck 19"),
    ("block", "w33d grinder"),
    ("block", "A-D-D-E-R-A-L-L 20mg"),
    ("block", "vaaaape juice"),
    ("block", "Vаpe pen"),               # the "а" here is a Cyrillic letter that looks like "a"
    ("block", "lean and percs"),
    ("flag", "nic pods, mint"),
    ("flag", "zaza, hit me up"),
    ("flag", "🍃🍃 party favors"),
    ("flag", "��💊 for finals week"),
    ("flag", "selling my plug's contact 🔌"),
]

