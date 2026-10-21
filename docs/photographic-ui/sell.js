"use strict";

(() => {
  const draftKey = "husky_demo_sell_draft";
  const listingsKey = "husky_demo_my_listings";
  const maxPhotos = 5;

  const form = document.querySelector("#sell-form");
  const fileInput = document.querySelector("#sell-photos");
  const photoGrid = document.querySelector("#sell-photo-grid");
  const status = document.querySelector("#sell-status");
  const steps = [...document.querySelectorAll(".sell-step")];

  const fields = [
    "title",
    "price",
    "category",
    "condition",
    "description",
    "area",
    "availability"
  ];

  const emptyDraft = () => ({
    photos: [],
    title: "",
    price: "",
    category: "",
    condition: "",
    description: "",
    area: "",
    availability: ""
  });

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  const storedDraft = read(draftKey, {});
  let draft = { ...emptyDraft(), ...storedDraft };

  if (draft.formVersion !== 2) {
    draft.category = "";
    draft.condition = "";
    draft.area = "";
    draft.formVersion = 2;
  }

  if (!Array.isArray(draft.photos)) {
    draft.photos = [];
  }

  let step = 1;
  let uploading = false;

  function announce(text) {
    status.textContent = text;
  }

  function persistDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      return true;
    } catch {
      announce("Browser storage is full. Remove photos or try smaller files.");
      return false;
    }
  }

  function saveFields() {
    for (const field of fields) {
      draft[field] = document.querySelector(`#sell-${field}`).value;
    }

    persistDraft();
  }

  function fillFields() {
    for (const field of fields) {
      document.querySelector(`#sell-${field}`).value =
        draft[field] ?? "";
    }
  }

  function photoView() {
    photoGrid.replaceChildren();

    draft.photos.forEach((src, index) => {
      const figure = document.createElement("figure");
      figure.className = "sell-photo";

      const img = document.createElement("img");
      img.src = src;
      img.alt = `Your item photo ${index + 1}`;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "sell-photo-remove";
      remove.textContent = "Remove";

      remove.setAttribute(
        "aria-label",
        `Remove photo ${index + 1}`
      );

      remove.addEventListener("click", () => {
        draft.photos.splice(index, 1);
        persistDraft();
        photoView();
      });

      figure.append(img, remove);
      photoGrid.append(figure);
    });

    document.querySelector("#sell-photo-count").textContent =
      `${draft.photos.length} of ${maxPhotos} photos`;

    document.querySelector("#sell-dropzone").hidden =
      draft.photos.length >= maxPhotos;
  }

  function compress(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => {
        reject(new Error("Photo could not be read."));
      };

      reader.onload = () => {
        const image = new Image();

        image.onerror = () => {
          reject(new Error("Photo is not a valid image."));
        };

        image.onload = () => {
          const scale = Math.min(
            1,
            960 / Math.max(image.width, image.height)
          );

          const canvas = document.createElement("canvas");

          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Image processing unavailable."));
            return;
          }

          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  async function addPhotos(files) {
    if (uploading) return;

    const accepted = [...files].slice(
      0,
      maxPhotos - draft.photos.length
    );

    if (!accepted.length) return;

    uploading = true;
    announce("Preparing photos...");

    try {
      for (const file of accepted) {
        const validType = [
          "image/jpeg",
          "image/png",
          "image/webp"
        ].includes(file.type);

        if (!validType || file.size > 5 * 1024 * 1024) {
          throw new Error(
            "Use JPG, PNG, or WebP images under 5 MB each."
          );
        }

        draft.photos.push(await compress(file));
      }

      photoView();

      if (persistDraft()) {
        announce("Photos added. Draft saved on this device.");
      }
    } catch (error) {
      photoView();
      announce(error.message);
    } finally {
      uploading = false;
      fileInput.value = "";
    }
  }

  function showStep(number) {
    step = number;

    steps.forEach((panel, index) => {
      panel.hidden = index + 1 !== step;
    });

    document.querySelector("#sell-step-count").textContent =
      `STEP ${step} OF 3`;

    document.querySelector("#sell-back").hidden = step === 1;

    document.querySelector("#sell-next").textContent =
      step === 3 ? "Publish demo listing →" : "Next step →";

    document.querySelectorAll(".sell-progress span")
      .forEach((el, index) => {
        el.classList.toggle("done", index < step);
      });

    if (step === 3) {
      document.querySelector("#sell-review-title").textContent =
        draft.title;

      document.querySelector("#sell-review-meta").textContent =
        `${draft.category} · ${draft.condition} · ${draft.area}`;

      document.querySelector("#sell-review-price").textContent =
        Number(draft.price) === 0 ? "FREE" : `$${draft.price}`;

      const preview = document.querySelector("#sell-review-image");
      preview.src = draft.photos[0] || "";
      preview.hidden = draft.photos.length === 0;
    }

    announce("");
  }

  function validateStep() {
    if (uploading) {
      announce("Wait for photos to finish processing.");
      return false;
    }

    if (step === 1 && draft.photos.length === 0) {
      announce("Add at least one photo to continue.");
      return false;
    }

    if (step === 2) {
      for (const name of [
        "title",
        "price",
        "category",
        "condition"
      ]) {
        const input = document.querySelector(`#sell-${name}`);

        if (!input.reportValidity()) {
          return false;
        }
      }

      if (!draft.title.trim()) {
        announce("Please enter a title.");
        return false;
      }

      if (
        !Number.isFinite(Number(draft.price)) ||
        Number(draft.price) < 0
      ) {
        announce("Enter a valid price.");
        return false;
      }

      if (
        draft.category === "Free" &&
        Number(draft.price) !== 0
      ) {
        announce("Free listings must have a $0 price.");
        return false;
      }
    }

    if (
      step === 3 &&
      !document.querySelector("#sell-area").reportValidity()
    ) {
      return false;
    }

    return true;
  }


  function renderPublished() {
    const root = document.querySelector("#sell-published");
    const count = document.querySelector("#sell-listing-count");

    root.replaceChildren();

    const stored = read(listingsKey, []);
    const saved = Array.isArray(stored) ? stored : [];

    count.textContent = String(saved.length);

    if (saved.length === 0) {
      const empty = document.createElement("p");
      empty.className = "sell-listings-empty";
      empty.textContent = "Your posted demo items will appear here.";
      root.append(empty);
      return;
    }

    for (const listing of saved.slice(0, 4)) {
      const row = document.createElement("div");
      row.className = "sell-published-item";

      const image = document.createElement("img");
      image.src = listing.photos?.[0] || "";
      image.alt = "";

      const info = document.createElement("div");
      info.className = "sell-published-info";

      const title = document.createElement("strong");
      title.className = "sell-published-title";
      title.textContent = listing.title || "Untitled listing";

      const meta = document.createElement("span");
      meta.className = "sell-published-meta";
      meta.textContent = "Demo ? Not live";

      info.append(title, meta);

      const price = document.createElement("strong");
      price.className = "sell-published-price";
      price.textContent = Number(listing.price) === 0
        ? "FREE"
        : "$" + listing.price;

      row.append(image, info, price);
      root.append(row);
    }

    if (saved.length > 4) {
      const more = document.createElement("p");
      more.className = "sell-listings-more";
      more.textContent =
        "+" + (saved.length - 4) + " more demo listings";
      root.append(more);
    }
  }

  function publish() {
    const listing = {
      id: Date.now(),
      title: draft.title.trim(),
      price: Number(draft.price),
      category: draft.category,
      condition: draft.condition,
      description: draft.description.trim(),
      area: draft.area,
      availability: draft.availability.trim(),
      photos: [...draft.photos],
      createdAt: new Date().toISOString(),
      status: "demo"
    };

    const saved = read(listingsKey, []);

    if (!Array.isArray(saved)) {
      announce("Could not read your saved demo listings.");
      return;
    }

    try {
      localStorage.setItem(
        listingsKey,
        JSON.stringify([listing, ...saved])
      );

      localStorage.removeItem(draftKey);
    } catch {
      announce(
        "Browser storage is full. Remove photos and try again."
      );
      return;
    }

    form.hidden = true;
    document.querySelector("#sell-tips").hidden = true;

    const success = document.querySelector("#sell-success");
    success.hidden = false;

    document.querySelector("#sell-success-title").textContent =
      listing.title;

    document.querySelector("#sell-success-price").textContent =
      listing.price === 0 ? "FREE" : `$${listing.price}`;

    document.querySelector("#sell-success-image").src =
      listing.photos[0];

    draft = emptyDraft();
    renderPublished();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  fillFields();
  photoView();
  renderPublished();
  showStep(1);

  form.addEventListener("input", saveFields);
  form.addEventListener("change", saveFields);

  fileInput.addEventListener("change", () => {
    addPhotos(fileInput.files);
  });

  const drop = document.querySelector("#sell-dropzone");

  ["dragenter", "dragover"].forEach(type => {
    drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach(type => {
    drop.addEventListener(type, event => {
      event.preventDefault();
      drop.classList.remove("dragging");
    });
  });

  drop.addEventListener("drop", event => {
    addPhotos(event.dataTransfer.files);
  });

  document.querySelector("#sell-back").addEventListener(
    "click",
    () => {
      saveFields();
      showStep(step - 1);
    }
  );

  form.addEventListener("submit", event => {
    event.preventDefault();
    saveFields();

    if (!validateStep()) return;

    if (step < 3) {
      showStep(step + 1);
    } else {
      publish();
    }
  });

  document.querySelector("#sell-again").addEventListener(
    "click",
    () => {
      fillFields();
      photoView();

      form.hidden = false;
      document.querySelector("#sell-tips").hidden = false;
      document.querySelector("#sell-success").hidden = true;

      showStep(1);
    }
  );
})();