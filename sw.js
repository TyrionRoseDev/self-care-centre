/* Ritual — service worker for web push notifications.
   Served from the site root so its scope covers the whole app. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (_) { data = { title: "Ritual", body: event.data ? event.data.text() : "" }; }

  const title = data.title || "Ritual";
  const options = {
    body: data.body || "",
    icon: "android-chrome-192x192.png",
    badge: "favicon-32x32.png",
    tag: data.tag || "ritual",
    renotify: true,
    vibrate: [80, 40, 80],
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of all) {
      if ("focus" in client) { try { await client.navigate(url); } catch (_) {} return client.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
