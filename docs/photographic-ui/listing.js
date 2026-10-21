
"use strict";

(() => {
  const { photos, listings } = window.HuskyDemo;
  const params = new URLSearchParams(window.location.search);
  const selectedId = Number(params.get("id") || 2);
  const listing = listings.find(item => item.id === selectedId);

  if (!listing) {
    const layout = document.querySelector(".detail-layout");
    const message = document.createElement("p");

    message.textContent = "This listing could not be found.";
    layout.replaceChildren(message);
    document.title = "Listing not found | Husky Marketplace";
    return;
  }

  const photoUrl = item => window.HuskyDemo.imageUrl(item, 1100);

  const savedKey = "husky_demo_saved";

  function loadSavedItems() {
    try {
      return new Set(
        JSON.parse(localStorage.getItem(savedKey) || "[]").map(String)
      );
    } catch {
      return new Set();
    }
  }

  const saved = loadSavedItems();

  function renderDetails() {
    document.title = `${listing.title} | Husky Marketplace`;

    document.querySelector("#item-title").textContent = listing.title;
    document.querySelector(".detail-price").textContent =
      listing.price === 0 ? "FREE" : `$${listing.price}`;

    document.querySelector(".detail-condition").textContent =
      `${listing.condition} condition · Recently listed`;

    document.querySelector(".detail-description").textContent =
      listing.description?.trim() ||
      `${listing.title} in ${listing.condition.toLowerCase()} condition. ` +
      `Available for pickup near ${listing.area}.`;

    document.querySelector(".detail-pickup").textContent =
      `⌖ Pickup near ${listing.area}`;

    const breadcrumb = document.querySelectorAll(".detail-breadcrumb span");
    breadcrumb[1].textContent = listing.category;
    breadcrumb[3].textContent = listing.title;

    const mainPhoto = document.querySelector("#main-product-photo");
    mainPhoto.src = photoUrl(listing);
    mainPhoto.alt = listing.title;

    const photosToShow = listing.photos?.length
      ? listing.photos
      : [photoUrl(listing)];

    const thumbs = document.querySelector(".detail-thumbnails");

    const buttons = photosToShow.map((src, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = index === 0
        ? "thumbnail active"
        : "thumbnail";

      button.setAttribute("aria-label", `View photo ${index + 1}`);

      const image = document.createElement("img");
      image.src = src;
      image.alt = "";

      button.append(image);

      button.addEventListener("click", () => {
        mainPhoto.src = src;

        buttons.forEach(other => {
          other.classList.toggle("active", other === button);
        });
      });

      return button;
    });

    thumbs.replaceChildren(...buttons);

    const messageLink = document.querySelector(".detail-actions a");
    messageLink.href = `messages.html?item=${listing.id}`;

    if (listing.source === "local-demo") {
      document.querySelector(".verified").textContent =
        "Your local demo listing";

      document.querySelector(".seller-avatar").textContent = "YOU";
      document.querySelector(".seller-info strong").textContent = "You";
      document.querySelector(".seller-info p").textContent =
        "Saved on this device";

      document.querySelector(".seller-profile-link").hidden = true;

      messageLink.removeAttribute("href");
      messageLink.textContent = "Your listing";
      messageLink.setAttribute("aria-disabled", "true");
      messageLink.classList.remove("btn-red");
      messageLink.classList.add("btn-outline");
    } else {
      const knownSellers = {
        2: [1, "Alex M.", "AM"],
        5: [1, "Alex M.", "AM"],
        8: [1, "Alex M.", "AM"],
        11: [1, "Alex M.", "AM"],
        3: [2, "Jamie L.", "JL"],
        6: [3, "Sam K.", "SK"]
      };

      const seller = knownSellers[listing.id];

      if (seller) {
        document.querySelector(".seller-info strong").textContent =
          seller[1];

        document.querySelector(".seller-avatar").textContent =
          seller[2];

        document.querySelector(".seller-profile-link").href =
          `seller.html?id=${seller[0]}`;
      } else {
        document.querySelector(".verified").textContent =
          "Fictional demo listing";

        document.querySelector(".seller-info strong").textContent =
          "Campus seller";

        document.querySelector(".seller-info p").textContent =
          "Sample account";

        document.querySelector(".seller-avatar").textContent = "NU";
        document.querySelector(".seller-profile-link").hidden = true;
      }
    }
  }

  function setupSaveButton() {
    const button = document.querySelector("#save-listing");
    const id = String(listing.id);

    function updateButton() {
      const isSaved = saved.has(id);

      button.setAttribute("aria-pressed", String(isSaved));
      button.replaceChildren(window.HuskyIcons.create("heart", isSaved), document.createTextNode(isSaved ? " Saved" : " Save"));
    }

    button.addEventListener("click", () => {
      if (saved.has(id)) {
        saved.delete(id);
      } else {
        saved.add(id);
      }

      try {
        localStorage.setItem(savedKey, JSON.stringify([...saved]));
      } catch {
        // Saved state remains available until the page reloads.
      }

      updateButton();
    });

    updateButton();
  }

  function createRelatedCard(item) {
    const card = document.createElement("article");
    card.className = "product-card";

    const link = document.createElement("a");
    link.className = "product-link";
    link.href = `listing.html?id=${item.id}`;

    const image = document.createElement("img");
    image.className = "product-photo";
    image.src = photoUrl(item);
    image.alt = item.title;
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "product-info";

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = item.price === 0 ? "FREE" : `$${item.price}`;

    const title = document.createElement("h3");
    title.className = "product-name";
    title.textContent = item.title;

    const location = document.createElement("p");
    location.className = "product-meta";
    location.textContent = `${item.area} · ${item.condition}`;

    info.append(price, title, location);
    link.append(image, info);
    card.append(link);

    return card;
  }

  function renderRelatedListings() {
    const otherListings = listings.filter(item => item.id !== listing.id);

    const sameCategory = otherListings.filter(
      item => item.category === listing.category
    );

    const differentCategory = otherListings.filter(
      item => item.category !== listing.category
    );

    const related = [...sameCategory, ...differentCategory].slice(0, 4);

    document.querySelector("#related-listings").replaceChildren(
      ...related.map(createRelatedCard)
    );
  }

  renderDetails();
  setupSaveButton();
  renderRelatedListings();
})();