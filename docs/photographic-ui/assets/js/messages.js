
"use strict";

(() => {
  const storageKey = "husky_demo_conversations";

  const sampleThreads = [
    {
      id: "chair",
      contact: "Alex M.",
      initials: "AM",
      listingId: 2,
      unread: false,
      messages: [
        { from: "me", text: "Hey! Is the desk chair still available?", time: "2:31 PM" },
        { from: "them", text: "Yep, still available!", time: "2:33 PM" },
        { from: "me", text: "Could I pick it up tomorrow at 4?", time: "2:35 PM" },
        { from: "them", text: "Sounds good, see you at Curry!", time: "2:38 PM" }
      ]
    },
    {
      id: "headphones",
      contact: "Jamie L.",
      initials: "JL",
      listingId: 3,
      unread: true,
      messages: [
        { from: "me", text: "Are the headphones still available?", time: "Yesterday" },
        { from: "them", text: "They're still available!", time: "Yesterday" }
      ]
    },
    {
      id: "camera",
      contact: "Sam K.",
      initials: "SK",
      listingId: 6,
      unread: false,
      messages: [
        { from: "me", text: "Would you take $85?", time: "Monday" }
      ]
    }
  ];

  const { listings } = window.HuskyDemo;

  const layout = document.querySelector("#inbox-layout");
  const threadList = document.querySelector("#thread-list");
  const threadSearch = document.querySelector("#conversation-search");
  const messageList = document.querySelector("#conv-messages");
  const messageForm = document.querySelector("#message-form");
  const messageInput = document.querySelector("#message-input");

  function loadThreads() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));

      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch {
      // Use sample conversations if stored data cannot be read.
    }

    return sampleThreads;
  }

  let threads = loadThreads();
  let activeId = threads[0].id;

  function saveThreads() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(threads));
    } catch {
      // Messages remain usable during the current session.
    }
  }

  function getListing(id) {
    return listings.find(item => item.id === id);
  }

  function getActiveThread() {
    return threads.find(thread => thread.id === activeId);
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }


  function getThreadActivity(thread) {
    const latestMessage = thread.messages?.at(-1);

    return Math.max(
      Number(thread.updatedAt) || 0,
      Number(latestMessage?.sentAt) || 0
    );
  }

  function renderThreads() {
    const query = threadSearch.value.trim().toLowerCase();

    const matching = [...threads]
      .sort((a, b) => getThreadActivity(b) - getThreadActivity(a))
      .filter(thread => {
      const listing = getListing(thread.listingId);

      const searchable = [
        thread.contact,
        listing?.title || "",
        ...thread.messages.map(message => message.text)
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });

    const buttons = matching.map(thread => {
      const listing = getListing(thread.listingId);
      const latest = thread.messages.at(-1);

      const button = createElement("button", "inbox-item");
      button.type = "button";

      const isActive = thread.id === activeId;
      button.classList.toggle("active", isActive);
      button.classList.toggle("unread", thread.unread);
      button.setAttribute("aria-pressed", String(isActive));

      const avatar = createElement(
        "span",
        "thread-avatar",
        thread.initials
      );

      const details = createElement("span", "thread-details");
      const top = createElement("span", "thread-topline");
      const name = createElement("strong", "", thread.contact);

      if (thread.unread) {
        const dot = createElement("span", "unread-dot");
        dot.setAttribute("aria-label", "Unread messages");
        name.append(dot);
      }

      const time = createElement(
        "time",
        "",
        latest?.time || ""
      );

      top.append(name, time);

      const product = createElement(
        "span",
        "thread-product",
        listing
          ? `${listing.title} · ${listing.price === 0 ? "FREE" : `$${listing.price}`}`
          : "Marketplace listing"
      );

      const preview = createElement(
        "span",
        "thread-preview",
        latest?.text || "Start the conversation"
      );

      details.append(top, product, preview);
      button.append(avatar, details);

      button.addEventListener("click", () => {
        selectThread(thread.id);
      });

      return button;
    });

    threadList.replaceChildren(...buttons);

    document.querySelector("#thread-count").textContent =
      String(threads.length);

    document.querySelector("#inbox-empty").hidden =
      matching.length > 0;
  }

  function renderMessages() {
    const thread = getActiveThread();
    if (!thread) return;


    const listing = getListing(thread.listingId);

    const sellerIds = {
      2: 1,
      5: 1,
      8: 1,
      11: 1,
      3: 2,
      6: 3
    };

    const sellerId = sellerIds[Number(thread.listingId)];
    const avatarLink = document.querySelector("#active-avatar-link");
    const profileLink = document.querySelector("#active-profile-link");

    for (const link of [avatarLink, profileLink]) {
      if (sellerId) {
        link.href = `seller.html?id=${sellerId}`;
      } else {
        link.removeAttribute("href");
      }
    }

    avatarLink.setAttribute(
      "aria-label",
      sellerId
        ? `View ${thread.contact}'s profile`
        : "Seller profile unavailable"
    );

    const photoId = listing && window.HuskyDemo.photos[listing.photo];
    const preview = document.querySelector(".listing-hover-card");

    preview.hidden = !photoId;

    if (listing && photoId) {
      const image = document.querySelector("#active-listing-image");

      image.src =
        `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=400&q=80`;
      image.alt = listing.title;

      document.querySelector("#active-preview-title").textContent =
        listing.title;

      document.querySelector("#active-preview-meta").textContent =
        `${listing.condition} ? ${listing.area} pickup`;

      document.querySelector("#active-preview-price").textContent =
        listing.price === 0 ? "FREE" : `$${listing.price}`;
    }

    document.querySelector("#active-contact").textContent =
      thread.contact;

    document.querySelector("#active-avatar").textContent =
      thread.initials;

    document.querySelector("#active-verification").textContent =
      "Verified student · Demo conversation";

    document.querySelector("#active-product").textContent =
      listing?.title || "Marketplace listing";

    document.querySelector("#active-price").textContent =
      listing
        ? (listing.price === 0 ? "FREE" : `$${listing.price}`)
        : "";

    document.querySelector("#active-listing-link").href =
      `listing.html?id=${thread.listingId}`;

    const day = createElement("div", "message-day", "Conversation");

    const bubbles = thread.messages.map(message => {
      const bubble = createElement(
        "div",
        message.from === "me" ? "bubble me" : "bubble"
      );

      const text = createElement("p", "", message.text);
      const time = createElement("small", "", message.time);

      bubble.append(text, time);

      return bubble;
    });

    messageList.replaceChildren(day, ...bubbles);
    messageList.scrollTop = messageList.scrollHeight;
  }

  function selectThread(id) {
    const thread = threads.find(item => item.id === id);
    if (!thread) return;

    activeId = id;
    thread.unread = false;

    saveThreads();
    renderThreads();
    renderMessages();

    layout.classList.add("chat-open");
  }

  function openListingConversation(listingId) {
    const existing = threads.find(
      thread => thread.listingId === listingId
    );

    if (existing) {
      selectThread(existing.id);
      return;
    }

    const listing = getListing(listingId);
    if (!listing) return;

    const thread = {
      id: `listing-${listingId}`,
      contact: "Campus seller",
      initials: "CS",
      listingId,
      unread: false,
      messages: []
    };

    threads.unshift(thread);
    saveThreads();
    selectThread(thread.id);
  }

  messageForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = messageInput.value.trim();
    if (!text) return;

    const thread = getActiveThread();
    if (!thread) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

    const sentAt = Date.now();

    thread.messages.push({
      from: "me",
      text,
      time,
      sentAt
    });

    thread.updatedAt = sentAt;

    messageInput.value = "";

    saveThreads();
    renderThreads();
    renderMessages();

    messageInput.focus();
  });

  threadSearch.addEventListener("input", renderThreads);

  document.querySelector("#back-to-inbox").addEventListener(
    "click",
    () => {
      layout.classList.remove("chat-open");
    }
  );

  const params = new URLSearchParams(window.location.search);
  const listingId = Number(params.get("item"));

  if (listingId && getListing(listingId)) {
    openListingConversation(listingId);
  } else if (params.get("seller") === "1") {
    selectThread("chair");
  } else {
    renderThreads();
    renderMessages();
  }
})();