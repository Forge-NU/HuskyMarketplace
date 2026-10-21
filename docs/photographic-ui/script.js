
"use strict";

const photos = {
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
  poster: "photo-1579783902614-a3fb3927b6a5"
};

const listings = [
  { id: 1, title: "Vintage denim jacket", price: 38, category: "Clothing", condition: "Good", area: "East Village", photo: "jacket", tag: "VINTAGE" },
  { id: 2, title: "White desk chair", price: 45, category: "Furniture", condition: "Good", area: "West Village", photo: "chair" },
  { id: 3, title: "Wireless headphones", price: 65, category: "Electronics", condition: "Like new", area: "LightView", photo: "headphones", tag: "HOT FIND" },
  { id: 4, title: "Study desk", price: 30, category: "Furniture", condition: "Good", area: "Fenway", photo: "desk" },
  { id: 5, title: "Reading lamp", price: 15, category: "Furniture", condition: "Excellent", area: "West Village", photo: "lamp" },
  { id: 6, title: "Vintage film camera", price: 95, category: "Electronics", condition: "Good", area: "Ruggles", photo: "camera", tag: "VINTAGE" },
  { id: 7, title: "White sneakers", price: 29, category: "Clothing", condition: "Good", area: "Fenway", photo: "sneakers" },
  { id: 8, title: "Textbook bundle", price: 12, category: "Books", condition: "Fair", area: "East Village", photo: "books" },
  { id: 9, title: "Small plant + pot", price: 0, category: "Free", condition: "Good", area: "LightView", photo: "plant", tag: "FREE" },
  { id: 10, title: "Cozy crewneck", price: 20, category: "Clothing", condition: "Excellent", area: "West Village", photo: "sweater" },
  { id: 11, title: "Portable speaker", price: 24, category: "Electronics", condition: "Good", area: "East Village", photo: "speaker" },
  { id: 12, title: "Art print for dorm", price: 10, category: "Free", condition: "Like new", area: "Fenway", photo: "poster" }
];

const grid = document.querySelector("#product-grid");
const search = document.querySelector("#search-input");
const priceRange = document.querySelector("#price-range");
const priceOutput = document.querySelector("#price-output");
const categoryRadios = document.querySelectorAll('input[name="category"]');
const chips = document.querySelectorAll(".chip[data-category]");
const sort = document.querySelector("#sort-listings");
const savedKey = "husky_demo_saved";

let category = "All";
let saved = new Set();

try {
  saved = new Set(
    JSON.parse(localStorage.getItem(savedKey) || "[]").map(String)
  );
} catch {
  saved = new Set();
}

function makeCard(item) {
  const card = document.createElement("article");
  card.className = "product-card";

  const link = document.createElement("a");
  link.className = "product-link";
  link.href = `listing.html?id=${item.id}`;

  const image = document.createElement("img");
  image.className = "product-photo";
  image.src = `https://images.unsplash.com/${photos[item.photo]}?auto=format&fit=crop&w=860&h=820&q=78`;
  image.alt = item.title;
  image.loading = "lazy";
  link.append(image);

  if (item.tag) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.tag;
    card.append(tag);
  }

  const details = document.createElement("div");
  details.className = "product-info";

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = item.price === 0 ? "FREE" : `$${item.price}`;

  const title = document.createElement("h2");
  title.className = "product-name";
  title.textContent = item.title;

  const meta = document.createElement("p");
  meta.className = "product-meta";
  meta.textContent = `⌖ ${item.area} · ${item.condition}`;

  details.append(price, title, meta);
  link.append(details);
  card.append(link);

  const heart = document.createElement("button");
  heart.className = "product-heart";
  heart.type = "button";
  heart.setAttribute("aria-label", `Save ${item.title}`);

  function updateHeart() {
    const isSaved = saved.has(String(item.id));
    heart.classList.toggle("saved", isSaved);
    heart.setAttribute("aria-pressed", String(isSaved));
    heart.textContent = isSaved ? "♥" : "♡";
  }

  heart.addEventListener("click", () => {
    const id = String(item.id);

    if (saved.has(id)) {
      saved.delete(id);
    } else {
      saved.add(id);
    }

    try {
      localStorage.setItem(savedKey, JSON.stringify([...saved]));
    } catch {
      // Keep saved items in memory when storage is unavailable.
    }

    updateHeart();
  });

  updateHeart();
  card.append(heart);

  return card;
}

function updateCategory(next) {
  category = next;

  categoryRadios.forEach(radio => {
    radio.checked = radio.value === next;
  });

  chips.forEach(chip => {
    const active = chip.dataset.category === next;
    chip.classList.toggle("active", active);
    chip.setAttribute("aria-pressed", String(active));
  });

  renderListings();
}

function renderListings() {
  const query = search.value.trim().toLowerCase();
  const maxPrice = Number(priceRange.value);

  priceOutput.value = `$${maxPrice}`;

  const matches = listings.filter(item => {
    const matchesCategory =
      category === "All" || category === item.category;

    const matchesPrice = item.price <= maxPrice;

    const searchableText =
      `${item.title} ${item.area} ${item.condition}`.toLowerCase();

    return matchesCategory &&
      matchesPrice &&
      searchableText.includes(query);
  });

  if (sort.value === "priceAsc") {
    matches.sort((a, b) => a.price - b.price);
  }

  if (sort.value === "priceDesc") {
    matches.sort((a, b) => b.price - a.price);
  }

  grid.replaceChildren(...matches.map(makeCard));

  document.querySelector("#result-count").textContent =
    `${matches.length} campus listing${matches.length === 1 ? "" : "s"}`;

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No matches yet. Try a different category or search.";
    grid.append(empty);
  }
}

categoryRadios.forEach(radio => {
  radio.addEventListener("change", () => updateCategory(radio.value));
});

chips.forEach(chip => {
  chip.addEventListener("click", () => updateCategory(chip.dataset.category));
});

search.addEventListener("input", renderListings);
priceRange.addEventListener("input", renderListings);
sort.addEventListener("change", renderListings);

document.querySelector("#clear-filters").addEventListener("click", () => {
  search.value = "";
  priceRange.value = "150";
  sort.value = "new";
  updateCategory("All");
});

document.querySelector("#theme-toggle").addEventListener("click", () => {
  document.documentElement.classList.toggle("theme-dark");

  const isDark = document.documentElement.classList.contains("theme-dark");
  document.querySelector("#theme-toggle").setAttribute(
    "aria-pressed",
    String(isDark)
  );
});

search.value =
  new URLSearchParams(window.location.search).get("q") || "";

renderListings();