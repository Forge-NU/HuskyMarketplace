"use strict";

const photos = {
  jacket: "photo-1666861585341-5bd1e7b1ed71",
  chair: "photo-1721743141584-73679ed9938c",
  headphones: "photo-1505740420928-5e560c06d30e",
  desk: "photo-1497366754035-f200968a6e72",
  lamp: "photo-1507473885765-e6ed057f782c",
  camera: "photo-1592744255669-e9e094a79927",
  sneakers: "photo-1544441892-794166f1e3be",
  books: "photo-1497633762265-9d179a990aa6",
  plant: "photo-1755504980103-374cf009b201",
  sweater: "photo-1576566588028-4147f3842f27",
  speaker: "photo-1608043152269-423dbba4e7e1",
  poster: "photo-1579783902614-a3fb3927b6a5"
};

const listings = [
  { id: 1, title: "Vintage denim jacket", price: 38, category: "Clothing", condition: "Good", area: "East Village", photo: "jacket", tag: "VINTAGE" },
  { id: 2, title: "White desk chair", price: 45, category: "Furniture", condition: "Good", area: "Fenway", photo: "chair" },
  { id: 3, title: "Wireless headphones", price: 65, category: "Electronics", condition: "Like new", area: "LightView", photo: "headphones", tag: "HOT FIND" },
  { id: 4, title: "Study desk", price: 30, category: "Furniture", condition: "Good", area: "Fenway", photo: "desk" },
  { id: 5, title: "Reading lamp", price: 15, category: "Furniture", condition: "Excellent", area: "Fenway", photo: "lamp" },
  { id: 6, title: "Vintage film camera", price: 95, category: "Electronics", condition: "Good", area: "Ruggles", photo: "camera", tag: "VINTAGE" },
  { id: 7, title: "White sneakers", price: 29, category: "Clothing", condition: "Good", area: "Fenway", photo: "sneakers" },
  { id: 8, title: "Textbook bundle", price: 12, category: "Books", condition: "Fair", area: "Fenway", photo: "books" },
  { id: 9, title: "Small plant + pot", price: 0, category: "Free", condition: "Good", area: "LightView", photo: "plant", tag: "FREE" },
  { id: 10, title: "Cozy crewneck", price: 20, category: "Clothing", condition: "Excellent", area: "West Village", photo: "sweater" },
  { id: 11, title: "Portable speaker", price: 24, category: "Electronics", condition: "Good", area: "Fenway", photo: "speaker" },  
  { id: 12, title: "Art print for dorm", price: 10, category: "Free", condition: "Like new", area: "Fenway", photo: "poster" }
];

window.HuskyDemo = { photos, listings };


// Merge locally published demo items into the marketplace.
try {
  const published = JSON.parse(
    localStorage.getItem("husky_demo_my_listings") || "[]"
  );

  if (Array.isArray(published)) {
    const known = new Set(listings.map(item => String(item.id)));

    for (const item of [...published].reverse()) {
      if (
        !item ||
        !Number.isSafeInteger(item.id) ||
        !item.title ||
        !Array.isArray(item.photos) ||
        !item.photos[0] ||
        item.status !== "demo" ||
        known.has(String(item.id))
      ) {
        continue;
      }

      listings.unshift({
        ...item,
        source: "local-demo",
        tag: "YOUR LISTING"
      });

      known.add(String(item.id));
    }
  }
} catch {
  // Built-in sample listings remain available.
}

// Uploaded photos use data URLs; sample listings use Unsplash.
window.HuskyDemo.imageUrl = (item, width = 860) =>
  item.photos?.[0] ||
  "https://images.unsplash.com/" +
  photos[item.photo] +
  "?auto=format&fit=crop&w=" + width + "&q=80";
