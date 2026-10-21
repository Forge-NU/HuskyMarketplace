"use strict";

(() => {
  const postKey = "husky_demo_moving_posts";
  const inquiryKey = "husky_demo_moving_inquiries";
  const accountKey = "husky_demo_identity";
  const samplePosts = [
    { id: "sample-carry", kind: "offer", name: "Jordan L.", title: "Help carrying boxes and small furniture", category: "Carrying & loading", area: "West Village", rate: 18, rateType: "hour", when: "Evenings and weekends", description: "Can help move boxes, chairs and small items between campus buildings. Message me with an estimate of what needs carrying.", photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=750&q=80" },
    { id: "sample-delivery", kind: "offer", name: "Taylor K.", title: "Furniture pickup help near campus", category: "Pickup & delivery", area: "Fenway", rate: 25, rateType: "fixed", when: "Weekends", description: "Helping with local handoffs and moving small furniture. Transport availability and item size must be confirmed before arranging anything.", photo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=750&q=80" },
    { id: "sample-assembly", kind: "offer", name: "Morgan R.", title: "Desk and shelf assembly", category: "Furniture assembly", area: "LightView", rate: 20, rateType: "hour", when: "Weekday afternoons", description: "Can help assemble simple flat-pack furniture. Please provide instructions and a list of items before scheduling.", photo: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=750&q=80" },
    { id: "sample-boxes", kind: "request", name: "Casey D.", title: "Need help carrying four boxes downstairs", category: "Carrying & loading", area: "East Village", rate: 30, rateType: "fixed", when: "Saturday afternoon", description: "Moving four medium boxes from an upper floor to a public pickup point. Elevator access is available.", photo: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=750&q=80" },
    { id: "sample-desk", kind: "request", name: "Riley P.", title: "Help moving a small desk", category: "Carrying & loading", area: "Ruggles", rate: 20, rateType: "hour", when: "Friday after class", description: "Need an extra pair of hands for a light desk. We can work out measurements and logistics in advance.", photo: "https://images.unsplash.com/photo-1721743141584-73679ed9938c?auto=format&fit=crop&w=750&q=80" }
  ];

  const $ = selector => document.querySelector(selector);
  const get = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value || fallback);
    } catch { return fallback; }
  };

  let selectedKind = "offer";
  let activeContact = null;
  const grid = $("#moving-grid");
  const postDialog = $("#moving-post-dialog");
  const contactDialog = $("#moving-contact-dialog");
  const postForm = $("#moving-post-form");
  const contactForm = $("#moving-contact-form");

  function element(tag, cls, value) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function price(post) {
    const amount = Number(post.rate) || 0;
    return amount === 0 ? "Free" : `$${amount.toLocaleString("en-US", {maximumFractionDigits: 2})}${post.rateType === "hour" ? " / hr" : " total"}`;
  }

  function allPosts() {
    return [...get(postKey, []), ...samplePosts];
  }

  function showPost(kind) {
    postForm.reset();
    $("#moving-post-kind").value = kind;
    $("#moving-post-title").textContent = kind === "offer" ? "Offer a service." : "Request help.";
    $("#moving-post-feedback").textContent = "";
    const user = get(accountKey, {});
    if (user.name) $("#moving-post-name").value = user.name;
    postDialog.showModal();
    $("#moving-post-title-input").focus();
  }

  function showContact(post) {
    activeContact = post;
    contactForm.reset();
    $("#moving-contact-title").textContent = post.kind === "request" ? "Offer to help." : "Ask about this service.";
    $("#moving-contact-summary").textContent = `${post.title} · ${post.name} · ${post.area} · ${price(post)}`;
    $("#moving-contact-feedback").textContent = "";
    contactDialog.showModal();
    $("#moving-contact-message").focus();
  }

  function postCard(post) {
    const article = element("article", "moving-card");
    const cover = element("div", "moving-card-photo");
    if (post.photo) {
      const image = document.createElement("img");
      image.src = post.photo;
      image.alt = "Sample furniture and moving space";
      image.loading = "lazy";
      cover.append(image);
    } else {
      cover.classList.add("moving-card-no-photo");
      cover.append(element("span", "", post.category));
    }
    const content = element("div", "moving-card-body");
    const top = element("div", "moving-card-top");
    top.append(element("span", "moving-type", post.kind === "offer" ? "SERVICE OFFER" : "HELP REQUEST"));
    top.append(element("span", "moving-sample", post.own ? "YOUR POST" : "DEMO EXAMPLE"));
    const title = element("h3", "", post.title);
    const by = element("p", "moving-by", `${post.name} · ${post.area}`);
    const desc = element("p", "moving-description", post.description);
    const tags = element("div", "moving-post-meta");
    tags.append(element("span", "", post.category), element("span", "", post.when));
    const bottom = element("div", "moving-card-bottom");
    bottom.append(element("strong", "moving-card-price", price(post)));
    const button = element("button", "btn btn-outline", post.own ? "Delete post" : (post.kind === "request" ? "Offer to help →" : "Ask about service →"));
    button.type = "button";
    if (post.own) {
      button.addEventListener("click", () => {
        if (!confirm(`Remove your demo post “${post.title}”?`)) return;
        const remaining = get(postKey, []).filter(row => row.id !== post.id);
        localStorage.setItem(postKey, JSON.stringify(remaining));
        render();
      });
    } else button.addEventListener("click", () => showContact(post));
    bottom.append(button);
    content.append(top, title, by, desc, tags, bottom);
    article.append(cover, content);
    return article;
  }

  function inquiryCard(inquiry) {
    const article = element("article", "moving-inquiry-card");
    article.append(element("span", "moving-type", "SAVED DEMO INQUIRY"), element("h3", "", inquiry.title), element("p", "moving-by", `To ${inquiry.recipient} · ${new Date(inquiry.createdAt).toLocaleDateString()}`), element("p", "", inquiry.message));
    return article;
  }

  function render() {
    const search = $("#moving-search").value.trim().toLowerCase();
    const category = $("#moving-category").value;
    const area = $("#moving-area").value;
    grid.replaceChildren();
    document.querySelectorAll(".market-tabs button").forEach(button => {
      const selected = button.dataset.kind === selectedKind;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    const filters = $(".market-filter-row");
    filters.hidden = selectedKind === "inquiries";

    if (selectedKind === "inquiries") {
      const inquiries = get(inquiryKey, []);
      grid.append(...inquiries.map(inquiryCard));
      $("#moving-count").textContent = `${inquiries.length} saved inquiries`;
      if (!inquiries.length) grid.append(element("p", "moving-empty", "No inquiries yet. Select a sample service to try the inquiry flow."));
      return;
    }

    const matching = allPosts().filter(post => {
      const typeMatch = selectedKind === "mine" ? post.own : post.kind === selectedKind;
      return typeMatch && (!category || post.category === category) && (!area || post.area === area) && (!search || [post.title, post.name, post.description, post.category].join(" ").toLowerCase().includes(search));
    });
    grid.append(...matching.map(postCard));
    $("#moving-count").textContent = `${matching.length} ${matching.length === 1 ? "post" : "posts"}`;
    if (!matching.length) {
      const empty = element("div", "moving-empty");
      empty.append(element("h3", "", "Nothing here yet."), element("p", "", "Try a different filter or create a demo post."));
      const action = element("button", "btn btn-red", "Create a post");
      action.type = "button";
      action.addEventListener("click", () => showPost("offer"));
      empty.append(action);
      grid.append(empty);
    }
  }

  const tabs = $(".market-tabs");
  const inquiriesTab = element("button", "", "My inquiries");
  inquiriesTab.type = "button";
  inquiriesTab.dataset.kind = "inquiries";
  tabs.append(inquiriesTab);
  tabs.addEventListener("click", event => {
    const button = event.target.closest("button[data-kind]");
    if (!button) return;
    selectedKind = button.dataset.kind;
    render();
  });
  document.querySelectorAll("[data-open-post]").forEach(button => button.addEventListener("click", () => showPost(button.dataset.openPost)));
  document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
  ["#moving-search", "#moving-category", "#moving-area"].forEach(selector => $(selector).addEventListener(selector === "#moving-search" ? "input" : "change", render));

  postForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!postForm.reportValidity()) return;
    const post = {
      id: `mine-${Date.now()}`,
      kind: $("#moving-post-kind").value,
      name: $("#moving-post-name").value.trim(),
      title: $("#moving-post-title-input").value.trim(),
      category: $("#moving-post-category").value,
      area: $("#moving-post-area").value,
      rate: Number($("#moving-post-rate").value),
      rateType: $("#moving-post-rate-type").value,
      when: $("#moving-post-when").value.trim(),
      description: $("#moving-post-description").value.trim(),
      own: true,
      createdAt: new Date().toISOString()
    };
    if (!post.name || !post.title || !post.when || post.description.length < 15) { $("#moving-post-feedback").textContent = "Please complete all required fields."; return; }
    const old = get(postKey, []);
    try { localStorage.setItem(postKey, JSON.stringify([post, ...old])); }
    catch { $("#moving-post-feedback").textContent = "Unable to save. Your browser storage may be full."; return; }
    postDialog.close();
    selectedKind = "mine";
    $("#moving-search").value = "";
    $("#moving-category").value = "";
    $("#moving-area").value = "";
    render();
    $("#moving-list-title").focus?.();
  });

  contactForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!activeContact || !contactForm.reportValidity()) return;
    const inquiry = {
      id: `inquiry-${Date.now()}`,
      postId: activeContact.id,
      title: activeContact.title,
      recipient: activeContact.name,
      message: $("#moving-contact-message").value.trim(),
      createdAt: new Date().toISOString()
    };
    if (inquiry.message.length < 10) return;
    try { localStorage.setItem(inquiryKey, JSON.stringify([inquiry, ...get(inquiryKey, [])])); }
    catch { $("#moving-contact-feedback").textContent = "Unable to save this inquiry."; return; }
    contactDialog.close();
    selectedKind = "inquiries";
    render();
  });
  render();
  const requestedPost = new URLSearchParams(location.search).get("post");
  if (requestedPost === "offer" || requestedPost === "request") showPost(requestedPost);
})();
