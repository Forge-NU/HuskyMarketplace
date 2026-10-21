
"use strict";

(() => {
  const { listings, photos } = window.HuskyDemo;

  const sellers = [
    {
      id: 1,
      name: "Alex Morgan",
      initials: "AM",
      area: "Fenway",
      bio: "Second-year student clearing out dorm stuff. Usually around Fenway, happy to bundle items!",
      listingIds: [2, 11, 5, 8]
    }
  ];

  const params = new URLSearchParams(window.location.search);
  const sellerId = Number(params.get("id") || 1);
  const seller = sellers.find(item => item.id === sellerId);

  if (!seller) {
    document.querySelector(".seller-page").textContent =
      "This seller could not be found.";
    return;
  }

  document.title = `${seller.name} | Husky Marketplace`;

  document.querySelector("#seller-heading").textContent =
    `Meet ${seller.name}`;

  document.querySelector("#seller-name").textContent = seller.name;

  document.querySelector("#seller-location").textContent =
    `Northeastern student · ${seller.area} area`;

  document.querySelector("#seller-bio-text").textContent = seller.bio;

  document.querySelector(".seller-avatar-large").textContent =
    seller.initials;

  document.querySelector("#seller-listings-heading").textContent =
    `${seller.name.split(" ")[0]}'s listings`;

  document.querySelector("#message-seller").href =
    `messages.html?seller=${seller.id}`;

  const sellerListings = seller.listingIds
    .map(id => listings.find(item => item.id === id))
    .filter(Boolean);

  function createListingCard(item) {
    const card = document.createElement("article");
    card.className = "product-card";

    const link = document.createElement("a");
    link.className = "product-link";
    link.href = `listing.html?id=${item.id}`;

    const image = document.createElement("img");
    image.className = "product-photo";
    image.src =
      `https://images.unsplash.com/${photos[item.photo]}` +
      "?auto=format&fit=crop&w=860&h=820&q=78";
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
      `✓ Verified · ${item.area} pickup`;

    info.append(price, title, location);
    link.append(image, info);
    card.append(link);

    return card;
  }

  const grid = document.querySelector("#seller-products");

  grid.replaceChildren(
    ...sellerListings.map(createListingCard)
  );
})();