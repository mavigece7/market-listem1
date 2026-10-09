const CACHE_ADI = "market-listem-v3";
const DOSYALAR = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_ADI).then((cache) => cache.addAll(DOSYALAR)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((anahtarlar) =>
        Promise.all(anahtarlar.filter((k) => k !== CACHE_ADI).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Önce ağdan (internetten) en güncel dosyayı almayı dener; başarılı olursa hem
// kullanıcıya o güncel dosyayı verir hem de önbelleği tazeler. Sadece internet
// yoksa (çevrimdışıyken) önbellekteki son bilinen sürümü kullanır. Böylece
// yeni bir yükleme yaptığında kullanıcı artık eski sürümde takılı kalmaz.
self.addEventListener("fetch", (e) => {
  const istek = e.request;
  // Sadece kendi sitemizdeki GET isteklerini yönetiyoruz; gerisi tarayıcıya kalır.
  if (istek.method !== "GET" || new URL(istek.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(istek)
      .then((yanit) => {
        // Sadece başarılı yanıtları önbelleğe al (404 / hata sayfaları saklanmasın).
        if (yanit && yanit.ok) {
          const kopya = yanit.clone();
          e.waitUntil(caches.open(CACHE_ADI).then((cache) => cache.put(istek, kopya)));
        }
        return yanit;
      })
      .catch(async () => {
        const onbellek = await caches.match(istek, { ignoreSearch: true });
        if (onbellek) return onbellek;
        // Çevrimdışıyken sayfa açılıyorsa (adres farklı olsa bile) uygulamanın kendisini göster.
        if (istek.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      })
  );
});
