"use strict";

(() => {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id") || 2);
  const listing = window.HuskyDemo?.listings.find(item => item.id === id);
  const actions = document.querySelector(".detail-actions");

  if (!actions || !listing || listing.source === "local-demo" || Number(listing.price) === 0) {
    return;
  }

  const link = document.createElement("a");
  link.className = "btn btn-outline make-offer-link";
  link.href = `messages.html?offer=${encodeURIComponent(id)}`;
  link.textContent = "Make an offer";

  const save = actions.querySelector("#save-listing");
  actions.insertBefore(link, save || null);
})();
