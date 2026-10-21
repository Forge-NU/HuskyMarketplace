"use strict";

(() => {
  // Husky local demo appearance preference
  try {
    const choice = localStorage.getItem("husky_demo_theme") || "light";
    const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("theme-dark", dark);
  } catch { /* Browsing remains functional without storage. */ }
  const header = document.querySelector(".site-header");
  const actions = header?.querySelector(".header-actions");
  if (!header || !actions) return;

  // A compact navigation menu remains available at browser zoom levels
  // that trigger narrow CSS viewports.
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mobile-menu-toggle";
  button.textContent = "☰";
  button.setAttribute("aria-label", "Open navigation");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "husky-mobile-navigation");

  const menu = document.createElement("nav");
  menu.className = "mobile-navigation";
  menu.id = "husky-mobile-navigation";
  menu.setAttribute("aria-label", "Mobile navigation");
  menu.hidden = true;

  const links = [
    ["Home", "home.html"],
    ["Shop", "browse.html"],
    ["Sell an item", "sell.html"],
    ["Messages", "messages.html"],
    ["Offers", "messages.html?tab=offers"],
    ["Saved items", "saved.html"],
    ["Moving help", "moving.html"],
    ["Account", "account.html"],
    ["Log in", "login.html"],
    ["Terms", "terms.html"],
    ["Privacy", "privacy.html"]
  ];

  for (const [name, url] of links) {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = name;
    menu.append(link);
  }

  const setOpen = open => {
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "✕" : "☰";
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };

  button.addEventListener("click", () => setOpen(menu.hidden));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setOpen(false);
  });
  document.addEventListener("click", event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  actions.append(button);
  header.append(menu);
})();
