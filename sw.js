const CACHE = "treino-tiago-v2.2.0";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=2.2.0",
  "./app.js?v=2.2.0",
  "./core.js?v=2.2.0",
  "./default-plan.js?v=2.2.0",
  "./vendor/fflate.js?v=2.2.0",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./modelo-treino.txt",
];
const allowed = new Set(
  ASSETS.map((path) => new URL(path, self.registration.scope).href),
);
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("treino-tiago-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !allowed.has(event.request.url)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response.ok
          ? response
          : (await cache.match(event.request)) || response;
      } catch (error) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate")
          return cache.match("./index.html");
        throw error;
      }
    })(),
  );
});
