"use strict";

(() => {
  const root = document.querySelector("#home-featured");
  const listings = window.HuskyDemo?.listings || [];
  const photoId = window.HuskyDemo?.photos || {};

  function photo(item) {
    return window.HuskyDemo.imageUrl?.(item, 650) || item.photos?.[0] ||
      `https://images.unsplash.com/${photoId[item.photo]}?auto=format&fit=crop&w=650&q=80`;
  }

  const cards = listings.slice(0, 4).map(item => {
    const card = document.createElement("article");
    card.className = "product-card";

    const link = document.createElement("a");
    link.className = "product-link";
    link.href = `listing.html?id=${encodeURIComponent(item.id)}`;

    const img = document.createElement("img");
    img.className = "product-photo";
    img.src = photo(item);
    img.alt = item.title;
    img.loading = "lazy";

    const info = document.createElement("div");
    info.className = "product-info";

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = Number(item.price) === 0 ? "FREE" : `$${item.price}`;

    const title = document.createElement("h3");
    title.className = "product-name";
    title.textContent = item.title;

    const area = document.createElement("p");
    area.className = "product-meta";
    area.textContent = `${item.area} · ${item.condition}`;

    info.append(price, title, area);
    link.append(img, info);
    card.append(link);
    return card;
  });

  root.replaceChildren(...cards);
})();
