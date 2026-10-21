
"use strict";

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
  image.src = window.HuskyDemo.imageUrl(item, 860);
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
    heart.replaceChildren(window.HuskyIcons.create("heart", isSaved));
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
  priceRange.value = priceRange.dataset.defaultMax || "150";
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

// Include locally posted items above the original $150 default.
const highestOwnPrice = Math.max(
  0,
  ...listings
    .filter(item => item.source === "local-demo")
    .map(item => Number(item.price) || 0)
);

const initialMax = highestOwnPrice > 150
  ? Math.ceil(highestOwnPrice / 50) * 50
  : 150;

priceRange.max = String(Math.max(200, initialMax));
priceRange.value = String(initialMax);
priceRange.dataset.defaultMax = String(initialMax);

renderListings();
// husky-category-deeplink: support category links from the homepage.
const requestedCategory = new URLSearchParams(location.search).get("category");
if (requestedCategory && [...categoryRadios].some(radio => radio.value === requestedCategory)) {
  updateCategory(requestedCategory);
}
