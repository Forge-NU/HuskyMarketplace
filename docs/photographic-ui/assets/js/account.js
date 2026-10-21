"use strict";

(() => {
  const profileKey = "husky_demo_identity";
  const sessionKey = "husky_demo_session";
  const themeKey = "husky_demo_theme";
  const $ = selector => document.querySelector(selector);
  const read = (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  };
  const campusEmail = email => /^[^\s@]+@northeastern\.edu$/i.test(email.trim());
  const feedback = text => { if ($("#auth-feedback")) $("#auth-feedback").textContent = text; };

  if ($("#demo-signup")) {
    $("#demo-signup").addEventListener("submit", event => {
      event.preventDefault();
      const email = $("#signup-email").value.trim().toLowerCase();
      const name = $("#signup-name").value.trim();
      if (!campusEmail(email)) { feedback("Use an @northeastern.edu email address for this demo."); return; }
      if (name.length < 2 || !$("#signup-agree").checked) { feedback("Enter a name and accept the Terms before continuing."); return; }
      const identity = { name, email, area: "", marketing: $("#signup-updates").checked, verification: "pending-demo" };
      try {
        localStorage.setItem(profileKey, JSON.stringify(identity));
        localStorage.setItem(sessionKey, "true");
      } catch { feedback("Unable to save this local profile. Check browser storage."); return; }
      location.assign("verify.html");
    });
  }

  if ($("#demo-login")) {
    $("#demo-login").addEventListener("submit", event => {
      event.preventDefault();
      const email = $("#demo-login-email").value.trim().toLowerCase();
      if (!campusEmail(email)) { feedback("Use an @northeastern.edu address."); return; }
      const saved = read(profileKey);
      if (!saved || saved.email !== email) { feedback("No local demo profile matches that email. Choose Create a demo profile below."); return; }
      localStorage.setItem(sessionKey, "true");
      location.assign("account.html");
    });
  }

  if ($("#demo-profile-form")) {
    const profile = read(profileKey);
    if (!profile || !read(sessionKey, false)) {
      location.replace("login.html");
      return;
    }
    $("#account-name").value = profile.name || "";
    $("#account-email").value = profile.email || "";
    $("#account-area").value = profile.area || "";
    $("#account-theme").value = localStorage.getItem(themeKey) || "light";
    $("#account-updates").checked = Boolean(profile.marketing);
    const count = key => { const records = read(key, []); return Array.isArray(records) ? records.length : 0; };
    $("#activity-listings").textContent = count("husky_demo_my_listings");
    $("#activity-services").textContent = count("husky_demo_moving_posts");
    $("#activity-offers").textContent = count("husky_demo_offers");

    $("#demo-profile-form").addEventListener("submit", event => {
      event.preventDefault();
      if (!$("#demo-profile-form").reportValidity()) return;
      profile.name = $("#account-name").value.trim();
      profile.area = $("#account-area").value;
      if (!profile.name) return;
      localStorage.setItem(profileKey, JSON.stringify(profile));
      $("#account-feedback").textContent = "Saved to this browser.";
    });
    $("#save-preferences").addEventListener("click", () => {
      profile.marketing = $("#account-updates").checked;
      localStorage.setItem(profileKey, JSON.stringify(profile));
      localStorage.setItem(themeKey, $("#account-theme").value);
      applyTheme($("#account-theme").value);
      $("#preferences-feedback").textContent = "Preferences saved on this device.";
    });
    $("#demo-signout").addEventListener("click", () => {
      localStorage.setItem(sessionKey, "false");
      location.assign("login.html");
    });
  }

  function applyTheme(theme) {
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("theme-dark", dark);
  }
})();
