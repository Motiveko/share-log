// Service Worker for Web Push Notifications

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received");

  let data = {
    title: "Notification",
    body: "You have a new notification",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  // TODO : 클릭시 랜딩 url 받아서 처리하기
  console.log("[Service Worker] Notification clicked");
  event.notification.close();

  // Navigate to the app when notification is clicked
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
  );
});
