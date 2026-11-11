// 오프라인에서도 열리도록 페이지를 저장해 둔다. 페이지는 온라인이면 항상 새로 받아 와서 업데이트가 바로 반영된다.
const CACHE = "bio-yesang-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html")) {
      e.respondWith(
        fetch(req)
          .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
          .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
      );
      return;
    }
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((r) => r || fetch(req).then((res) => { c.put(req, res.clone()); return res; })))
    );
  }
});
