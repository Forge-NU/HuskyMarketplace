// Sample records transcribed from docs/photographic-ui/listings-data.js.
// NOT live Supabase records. Browser-created demo records stay on this device.
export type DemoListing = {
  id: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  area: string;
  photo: string;
  tag?: string;
  description?: string;
  photos?: string[];
  status?: string;
  source?: string;
  availability?: string;
};
export type DemoMessage = { from: "me" | "them"; text: string; time: string };
export type DemoThread = {
  id: string;
  contact: string;
  initials: string;
  listingId: number;
  unread: boolean;
  messages: DemoMessage[];
};
export type DemoOffer = {
  id: string;
  listingId: number;
  amount: number;
  note: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

export const PHOTO_IDS: Record<string, string> = {
  jacket: "photo-1666861585341-5bd1e7b1ed71",
  chair: "photo-1721743141584-73679ed9938c",
  headphones: "photo-1505740420928-5e560c06d30e",
  desk: "photo-1497366754035-f200968a6e72",
  lamp: "photo-1507473885765-e6ed057f782c",
  camera: "photo-1592744255669-e9e094a79927",
  sneakers: "photo-1544441892-794166f1e3be",
  books: "photo-1497633762265-9d179a990aa6",
  plant: "photo-1755504980103-374cf009b201",
  sweater: "photo-1576566588028-4147f3842f27",
  speaker: "photo-1608043152269-423dbba4e7e1",
  poster: "photo-1579783902614-a3fb3927b6a5",
};
export const PHOTO_LISTINGS: DemoListing[] = [
  {
    id: 1,
    title: "Vintage denim jacket",
    price: 38,
    category: "Clothing",
    condition: "Good",
    area: "East Village",
    photo: "jacket",
    tag: "VINTAGE",
  },
  {
    id: 2,
    title: "White desk chair",
    price: 45,
    category: "Furniture",
    condition: "Good",
    area: "Fenway",
    photo: "chair",
  },
  {
    id: 3,
    title: "Wireless headphones",
    price: 65,
    category: "Electronics",
    condition: "Like new",
    area: "LightView",
    photo: "headphones",
    tag: "HOT FIND",
  },
  {
    id: 4,
    title: "Study desk",
    price: 30,
    category: "Furniture",
    condition: "Good",
    area: "Fenway",
    photo: "desk",
  },
  {
    id: 5,
    title: "Reading lamp",
    price: 15,
    category: "Furniture",
    condition: "Excellent",
    area: "Fenway",
    photo: "lamp",
  },
  {
    id: 6,
    title: "Vintage film camera",
    price: 95,
    category: "Electronics",
    condition: "Good",
    area: "Ruggles",
    photo: "camera",
    tag: "VINTAGE",
  },
  {
    id: 7,
    title: "White sneakers",
    price: 29,
    category: "Clothing",
    condition: "Good",
    area: "Fenway",
    photo: "sneakers",
  },
  {
    id: 8,
    title: "Textbook bundle",
    price: 12,
    category: "Books",
    condition: "Fair",
    area: "Fenway",
    photo: "books",
  },
  {
    id: 9,
    title: "Small plant + pot",
    price: 0,
    category: "Free",
    condition: "Good",
    area: "LightView",
    photo: "plant",
    tag: "FREE",
  },
  {
    id: 10,
    title: "Cozy crewneck",
    price: 20,
    category: "Clothing",
    condition: "Excellent",
    area: "West Village",
    photo: "sweater",
  },
  {
    id: 11,
    title: "Portable speaker",
    price: 24,
    category: "Electronics",
    condition: "Good",
    area: "Fenway",
    photo: "speaker",
  },
  {
    id: 12,
    title: "Art print for dorm",
    price: 10,
    category: "Free",
    condition: "Like new",
    area: "Fenway",
    photo: "poster",
  },
];

export const SELLERS = [
  {
    id: 1,
    name: "Alex Morgan",
    initials: "AM",
    area: "Fenway",
    bio: "Second-year student clearing out dorm stuff. Usually around Fenway, happy to bundle items!",
    listingIds: [2, 11, 5, 8],
  },
  {
    id: 2,
    name: "Jamie L.",
    initials: "JL",
    area: "LightView",
    bio: "Northeastern student selling electronics and campus essentials.",
    listingIds: [3],
  },
  {
    id: 3,
    name: "Sam K.",
    initials: "SK",
    area: "Ruggles",
    bio: "Student selling photography gear and secondhand finds.",
    listingIds: [6],
  },
];
export function sellerForListing(id: number) {
  return SELLERS.find((s) => s.listingIds.includes(id));
}
export const SAMPLE_THREADS: DemoThread[] = [
  {
    id: "chair",
    contact: "Alex M.",
    initials: "AM",
    listingId: 2,
    unread: false,
    messages: [
      {
        from: "me",
        text: "Hey! Is the desk chair still available?",
        time: "2:31 PM",
      },
      { from: "them", text: "Yep, still available!", time: "2:33 PM" },
      {
        from: "me",
        text: "Could I pick it up tomorrow at 4?",
        time: "2:35 PM",
      },
      { from: "them", text: "Sounds good, see you at Curry!", time: "2:38 PM" },
    ],
  },
  {
    id: "headphones",
    contact: "Jamie L.",
    initials: "JL",
    listingId: 3,
    unread: true,
    messages: [
      {
        from: "me",
        text: "Are the headphones still available?",
        time: "Yesterday",
      },
      { from: "them", text: "They're still available!", time: "Yesterday" },
    ],
  },
  {
    id: "camera",
    contact: "Sam K.",
    initials: "SK",
    listingId: 6,
    unread: false,
    messages: [{ from: "me", text: "Would you take $85?", time: "Monday" }],
  },
];
export const KEYS = {
  saved: "husky_demo_saved",
  listings: "husky_demo_my_listings",
  draft: "husky_demo_sell_draft",
  conversations: "husky_demo_conversations",
  offers: "husky_demo_offers",
  identity: "husky_demo_identity",
  moving: "husky_demo_moving_posts",
  inquiries: "husky_demo_moving_inquiries",
  theme: "husky_demo_theme",
} as const;
export function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "null");
    return v === null ? fallback : (v as T);
  } catch {
    return fallback;
  }
}
export function setStored<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("husky-demo-update"));
    return true;
  } catch {
    return false;
  }
}
export function getSaved(): string[] {
  const v = getStored<unknown>(KEYS.saved, []);
  return Array.isArray(v) ? v.map(String) : [];
}
export function getListings(): DemoListing[] {
  const local = getStored<DemoListing[]>(KEYS.listings, []);
  return [
    ...(Array.isArray(local)
      ? local.filter((x) => x && x.status === "demo")
      : []),
    ...PHOTO_LISTINGS,
  ];
}
export function getPhoto(item: DemoListing, width = 800) {
  return (
    item.photos?.[0] ||
    (item.photo.startsWith("data:")
      ? item.photo
      : `https://images.unsplash.com/${PHOTO_IDS[item.photo] || PHOTO_IDS.chair}?auto=format&fit=crop&w=${width}&q=80`)
  );
}
export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((x) => x[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export const MOVING_EXAMPLES = [
  {
    id: "sample-carry",
    kind: "offer",
    name: "Jordan L.",
    title: "Help carrying boxes and small furniture",
    category: "Carrying & loading",
    area: "West Village",
    rate: 18,
    rateType: "hour",
    when: "Evenings and weekends",
    description:
      "Can help move boxes, chairs and small items between campus buildings.",
    photo:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=750&q=80",
  },
  {
    id: "sample-delivery",
    kind: "offer",
    name: "Taylor K.",
    title: "Furniture pickup help near campus",
    category: "Pickup & delivery",
    area: "Fenway",
    rate: 25,
    rateType: "fixed",
    when: "Weekends",
    description: "Helping with local handoffs and moving small furniture.",
    photo:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=750&q=80",
  },
  {
    id: "sample-assembly",
    kind: "offer",
    name: "Morgan R.",
    title: "Desk and shelf assembly",
    category: "Furniture assembly",
    area: "LightView",
    rate: 20,
    rateType: "hour",
    when: "Weekday afternoons",
    description: "Can help assemble simple flat-pack furniture.",
    photo:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=750&q=80",
  },
  {
    id: "sample-boxes",
    kind: "request",
    name: "Casey D.",
    title: "Need help carrying four boxes downstairs",
    category: "Carrying & loading",
    area: "East Village",
    rate: 30,
    rateType: "fixed",
    when: "Saturday afternoon",
    description:
      "Moving four medium boxes from an upper floor to a public pickup point.",
    photo:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=750&q=80",
  },
  {
    id: "sample-desk",
    kind: "request",
    name: "Riley P.",
    title: "Help moving a small desk",
    category: "Carrying & loading",
    area: "Ruggles",
    rate: 20,
    rateType: "hour",
    when: "Friday after class",
    description: "Need an extra pair of hands for a light desk.",
    photo:
      "https://images.unsplash.com/photo-1721743141584-73679ed9938c?auto=format&fit=crop&w=750&q=80",
  },
] as const;
export type MovingPost = {
  id: string;
  kind: string;
  name: string;
  title: string;
  category: string;
  area: string;
  rate: number;
  rateType: string;
  when: string;
  description: string;
  photo?: string;
};
