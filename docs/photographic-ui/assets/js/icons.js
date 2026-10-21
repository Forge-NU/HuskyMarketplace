"use strict";

(() => {
  const ns = "http://www.w3.org/2000/svg";

  const paths = {
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z",
    message: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 17 0Z"
  };

  function create(name, filled = false) {
    if (!paths[name]) {
      throw new Error(`Unknown icon: ${name}`);
    }

    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "22");
    svg.setAttribute("height", "22");
    svg.setAttribute("fill", filled ? "currentColor" : "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", paths[name]);
    svg.append(path);

    return svg;
  }

  window.HuskyIcons = { create };

  document.querySelectorAll('a[aria-label="Messages"]').forEach(link => {
    link.replaceChildren(create("message"));
  });

  document.querySelectorAll('a[aria-label="Saved items"]').forEach(link => {
    const active = link.getAttribute("aria-current") === "page";
    link.replaceChildren(create("heart", active));
  });

  document.querySelectorAll(".empty-heart").forEach(element => {
    element.replaceChildren(create("heart"));
  });
})();