
"use strict";

(() => {
  const { listings, photos } = window.HuskyDemo;

  const grid = document.querySelector("#saved-grid");
  const emptyState = document.querySelector("#saved-empty");
  const savedCount = document.querySelector("#saved-count");

  const storageKey = "husky_demo_saved";

  function getSavedIds() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );

      return new Set(
        Array.isArray(stored) ? stored.map(String) : []
      );
    } catch {
      return new Set();
    }
  }

  function saveIds(ids) {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify([...ids])
      );
    } catch {
      // Keep the current page usable if storage is unavailable.
    }
  }

  function createCard(item) {
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

    const info = document.createElement("div");
    info.className = "product-info";

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent =
      item.price === 0 ? "FREE" : `$${item.price}`;

    const title = document.createElement("h3");
    title.className = "product-name";
    title.textContent = item.title;

    const location = document.createElement("p");
    location.className = "product-meta";
    location.textContent =
      `${item.area} · ${item.condition}`;

    info.append(price, title, location);
    link.append(image, info);
    card.append(link);

    const removeButton = document.createElement("button");
    removeButton.className = "product-heart saved";
    removeButton.type = "button";
    removeButton.replaceChildren(window.HuskyIcons.create("heart", true));
    removeButton.setAttribute("aria-pressed", "true");
    removeButton.setAttribute(
      "aria-label",
      `Remove ${item.title} from saved items`
    );

    removeButton.addEventListener("click", () => {
      const savedIds = getSavedIds();
      savedIds.delete(String(item.id));

      saveIds(savedIds);
      renderSavedItems();
    });

    card.append(removeButton);

    return card;
  }

  function renderSavedItems() {
    const savedIds = getSavedIds();

    const savedListings = listings.filter(item =>
      savedIds.has(String(item.id))
    );

    grid.replaceChildren(
      ...savedListings.map(createCard)
    );

    const count = savedListings.length;

    savedCount.textContent =
      `${count} saved item${count === 1 ? "" : "s"}`;

    emptyState.hidden = count > 0;
  }

  renderSavedItems();
})();