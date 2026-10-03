const CACHE_ADI = "market-listem-v2";
const DOSYALAR = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_ADI).then((cache) => cache.addAll(DOSYALAR)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((anahtarlar) =>
      Promise.all(anahtarlar.filter((k) => k !== CACHE_ADI).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Önce ağdan (internetten) en güncel dosyayı almayı dener; başarılı olursa hem
// kullanıcıya o güncel dosyayı verir hem de önbelleği tazeler. Sadece internet
// yoksa (çevrimdışıyken) önbellekteki son bilinen sürümü kullanır. Böylece
// yeni bir yükleme yaptığında kullanıcı artık eski sürümde takılı kalmaz.
self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request)
      .then((yanit) => {
        const kopya = yanit.clone();
        caches.open(CACHE_ADI).then((cache) => cache.put(e.request, kopya));
        return yanit;
      })
      .catch(() => caches.match(e.request))
  );
});
