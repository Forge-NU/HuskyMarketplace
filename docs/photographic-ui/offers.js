"use strict";

(() => {
  const layout = document.querySelector("#inbox-layout");
  const sidebar = layout?.querySelector(".inbox-list");
  const conversation = layout?.querySelector(".conversation");
  const search = layout?.querySelector(".inbox-search");
  const list = document.querySelector("#thread-list");
  const empty = document.querySelector("#inbox-empty");
  const count = document.querySelector("#thread-count");

  if (!layout || !sidebar || !conversation || !list) return;

  const key = "husky_demo_offers";
  const catalog = window.HuskyDemo?.listings || [];
  const params = new URLSearchParams(location.search);
  const sellerByItem = new Map([[2, ["Alex M.", 1]], [5, ["Alex M.", 1]], [8, ["Alex M.", 1]], [11, ["Alex M.", 1]], [3, ["Jamie L.", 2]], [6, ["Sam K.", 3]]]);
  const findItem = id => catalog.find(item => Number(item.id) === Number(id));
  const formatPrice = value => `$${Number(value).toLocaleString(undefined, {maximumFractionDigits: 2})}`;

  let offers = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(parsed)) offers = parsed.filter(offer => offer && offer.id);
  } catch {
    // Invalid old browser storage should not break Messages.
  }

  const tabs = document.createElement("div");
  tabs.className = "inbox-tabs";
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "Inbox type");

  const chatsTab = document.createElement("button");
  chatsTab.type = "button";
  chatsTab.className = "inbox-tab active";
  chatsTab.textContent = "Chats";
  chatsTab.setAttribute("aria-pressed", "true");

  const offersTab = document.createElement("button");
  offersTab.type = "button";
  offersTab.className = "inbox-tab";
  offersTab.textContent = "Offers";
  offersTab.setAttribute("aria-pressed", "false");

  tabs.append(chatsTab, offersTab);
  sidebar.insertBefore(tabs, search || list);

  const offerList = document.createElement("div");
  offerList.className = "offer-list";
  offerList.hidden = true;
  offerList.setAttribute("aria-label", "Offers you have sent");
  list.after(offerList);

  const offerPanel = document.createElement("section");
  offerPanel.className = "offer-detail";
  offerPanel.setAttribute("aria-labelledby", "offer-panel-title");
  offerPanel.innerHTML = `
    <header class="offer-panel-header">
      <button type="button" class="back-to-offers" id="back-to-offers" aria-label="Back to offers">←</button>
      <div><p class="eyebrow">MARKETPLACE OFFERS</p><h2 id="offer-panel-title">Make an offer</h2></div>
    </header>
    <div class="offer-content">
      <p class="offer-intro" id="offer-intro">Select an offer or find something you like in Browse.</p>
      <div class="offer-product" id="offer-product" hidden>
        <img id="offer-product-image" alt="">
        <div><a id="offer-product-name" href="browse.html"></a><p id="offer-product-meta"></p><strong id="offer-product-price"></strong></div>
      </div>
      <form id="offer-form" hidden>
        <label for="offer-amount">Your offer ($) *</label>
        <input id="offer-amount" type="number" min="0.01" max="100000" step="0.01" required inputmode="decimal" placeholder="Enter an amount">
        <label for="offer-note">Note to the seller (optional)</label>
        <textarea id="offer-note" maxlength="300" rows="3" placeholder="Would you consider this price? I can pick up on campus."></textarea>
        <button class="btn btn-red" type="submit">Submit demo offer</button>
      </form>
      <div id="offer-existing" hidden>
        <div class="offer-amount-line"><span>Your offer</span><strong id="offer-existing-amount"></strong></div>
        <p id="offer-existing-note"></p>
        <p class="offer-status" id="offer-existing-status"></p>
        <div class="offer-actions">
          <a id="offer-message-seller" class="btn btn-outline" href="messages.html">Message seller</a>
          <button id="offer-withdraw" class="btn btn-outline" type="button">Withdraw offer</button>
        </div>
      </div>
      <p class="offer-disclaimer">Demo only. Offers are saved on this device, not delivered to sellers. Payments aren't processed here.</p>
      <p class="offer-notice" id="offer-notice" role="status" aria-live="polite"></p>
    </div>`;
  layout.append(offerPanel);

  const el = id => document.getElementById(id);
  const imageUrl = item => window.HuskyDemo.imageUrl?.(item, 440) || item.photos?.[0] ||
    `https://images.unsplash.com/${window.HuskyDemo.photos[item.photo]}?auto=format&fit=crop&w=440&q=80`;
  let selectedListing = null;
  let selectedOffer = null;

  function saveOffers() {
    try {
      localStorage.setItem(key, JSON.stringify(offers));
      return true;
    } catch {
      el("offer-notice").textContent = "Browser storage is full. Could not save the offer.";
      return false;
    }
  }

  function openPanel() {
    layout.classList.add("offer-open");
    offerPanel.scrollTop = 0;
  }

  function setTab(next) {
    const showingOffers = next === "offers";
    layout.classList.toggle("offers-mode", showingOffers);
    if (showingOffers) layout.classList.remove("chat-open");
    else layout.classList.remove("offer-open");
    chatsTab.classList.toggle("active", !showingOffers);
    offersTab.classList.toggle("active", showingOffers);
    chatsTab.setAttribute("aria-pressed", String(!showingOffers));
    offersTab.setAttribute("aria-pressed", String(showingOffers));
    list.hidden = showingOffers;
    offerList.hidden = !showingOffers;
    if (search) search.hidden = showingOffers;
    if (empty) empty.hidden = showingOffers || !list.children.length;
    conversation.hidden = showingOffers;
    count.textContent = String(showingOffers ? offers.length : list.querySelectorAll(".inbox-item").length);
    if (showingOffers) renderOfferList();
  }

  function displayProduct(item) {
    const block = el("offer-product");
    block.hidden = !item;
    if (!item) return;
    el("offer-product-image").src = imageUrl(item);
    el("offer-product-image").alt = item.title;
    el("offer-product-name").textContent = item.title;
    el("offer-product-name").href = `listing.html?id=${encodeURIComponent(item.id)}`;
    el("offer-product-meta").textContent = `${item.condition} · ${item.area} pickup`;
    el("offer-product-price").textContent = `Asking ${formatPrice(item.price)}`;
  }

  function showPrompt() {
    selectedListing = null;
    selectedOffer = null;
    layout.classList.remove("offer-open");
    el("offer-panel-title").textContent = "Your offers";
    el("offer-intro").textContent = "Offers you send will appear here. Open an item and choose Make an offer to start.";
    displayProduct(null);
    el("offer-form").hidden = true;
    el("offer-existing").hidden = true;
    el("offer-notice").textContent = "";
    renderOfferList();
  }

  function composeFor(item) {
    if (!item || item.source === "local-demo" || Number(item.price) <= 0) return showPrompt();
    selectedOffer = null;
    selectedListing = item;
    el("offer-panel-title").textContent = "Make an offer";
    el("offer-intro").textContent = "Suggest a price. The seller can decide whether to accept once real messaging is connected.";
    displayProduct(item);
    el("offer-form").hidden = false;
    el("offer-existing").hidden = true;
    el("offer-amount").value = "";
    el("offer-note").value = "";
    el("offer-notice").textContent = "";
    renderOfferList();
    openPanel();
  }

  function openExisting(offer) {
    selectedOffer = offer;
    selectedListing = findItem(offer.listingId);
    el("offer-panel-title").textContent = "Offer details";
    el("offer-intro").textContent = "You can open the listing or message the seller about your offer.";
    displayProduct(selectedListing);
    el("offer-form").hidden = true;
    el("offer-existing").hidden = false;
    el("offer-existing-amount").textContent = formatPrice(offer.amount);
    el("offer-existing-note").textContent = offer.note || "No note included.";
    el("offer-existing-status").textContent = `Status: ${offer.status}`;
    el("offer-withdraw").hidden = offer.status !== "Pending";
    el("offer-message-seller").href = `messages.html?item=${encodeURIComponent(offer.listingId)}`;
    el("offer-notice").textContent = "";
    renderOfferList();
    openPanel();
  }

  function renderOfferList() {
    offerList.replaceChildren();
    const ordered = [...offers].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (ordered.length === 0) {
      const blank = document.createElement("div");
      blank.className = "offers-empty";
      const p = document.createElement("p");
      p.textContent = "No offers yet. Find something you love and suggest a price.";
      const link = document.createElement("a");
      link.href = "browse.html";
      link.className = "btn btn-outline";
      link.textContent = "Browse listings";
      blank.append(p, link);
      offerList.append(blank);
    }
    for (const offer of ordered) {
      const item = findItem(offer.listingId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "offer-row";
      button.classList.toggle("active", selectedOffer?.id === offer.id);
      const title = document.createElement("strong");
      title.textContent = item?.title || "Marketplace listing";
      const money = document.createElement("span");
      money.textContent = `${formatPrice(offer.amount)} · ${offer.status}`;
      button.append(title, money);
      button.addEventListener("click", () => openExisting(offer));
      offerList.append(button);
    }
    if (layout.classList.contains("offers-mode")) count.textContent = String(offers.length);
  }

  chatsTab.addEventListener("click", () => setTab("chats"));
  offersTab.addEventListener("click", () => { setTab("offers"); showPrompt(); });
  el("back-to-offers").addEventListener("click", () => layout.classList.remove("offer-open"));

  el("offer-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!selectedListing) return;
    const amount = Number(el("offer-amount").value);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      el("offer-notice").textContent = "Enter a valid offer amount.";
      return;
    }
    const offer = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      listingId: selectedListing.id,
      amount: Math.round(amount * 100) / 100,
      askingPrice: Number(selectedListing.price),
      note: el("offer-note").value.trim(),
      status: "Pending",
      updatedAt: Date.now()
    };
    offers.unshift(offer);
    if (!saveOffers()) {
      offers.shift();
      return;
    }
    openExisting(offer);
    el("offer-notice").textContent = "Demo offer saved on this device.";
  });

  el("offer-withdraw").addEventListener("click", () => {
    if (!selectedOffer || selectedOffer.status !== "Pending") return;
    selectedOffer.status = "Withdrawn";
    selectedOffer.updatedAt = Date.now();
    if (saveOffers()) openExisting(selectedOffer);
  });

  // Avoid the original conversation renderer restoring the thread count
  // while the Offers tab is selected.
  new MutationObserver(() => {
    if (layout.classList.contains("offers-mode") && count.textContent !== String(offers.length)) {
      count.textContent = String(offers.length);
    }
  }).observe(count, { childList: true, characterData: true, subtree: true });

  const offerId = Number(params.get("offer"));
  const startOnOffers = params.get("tab") === "offers" || Number.isSafeInteger(offerId) && offerId > 0;
  setTab(startOnOffers ? "offers" : "chats");
  if (startOnOffers && offerId > 0) composeFor(findItem(offerId));
  else showPrompt();
})();
