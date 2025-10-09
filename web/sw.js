/* v0.1.0 — Replacement */
const CACHE = "masrofi-cache-v1";
const ASSETS = [
  "./", "./index.html", "./main.css",
  "./app-config.js","./app-i18n.js","./app-state.js","./app-utils.js",
  "./app-dom.js","./app-forms.js","./app-data.js","./app-sync.js"
];
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
