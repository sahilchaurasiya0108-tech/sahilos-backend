// SahilOS Service Worker — handles web push notifications
// Place this file at: frontend/public/sw.js

const CACHE_NAME = "sahilos-v1";

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// ── Push event ────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (_) {
    data = { title: "SahilOS", body: event.data.text(), url: "/" };
  }

  const options = {
    body: data.body || data.message || "",
    icon: data.icon || "/favicon.svg",
    badge: data.badge || "/favicon.svg",
    // FIX: unique tag per notification so every push shows on phone.
    // Same tag = silent replacement (the old behaviour swallowed notifications).
    tag: data.tag || `sahilos-${Date.now()}`,
    renotify: true,
    data: { url: data.url || "/" },
    actions: [
      { action: "open",    title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    Promise.all([
      // 1. Show the OS notification on the phone
      self.registration.showNotification(data.title || "SahilOS", options),

      // 2. Tell any open app tabs to refresh their notification list immediately
      //    instead of waiting for the 30-second poll
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: "NOTIFICATION_RECEIVED" });
        }
      }),
    ])
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing SahilOS tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Push subscription change ──────────────────────────────────────────────────
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then((newSubscription) => {
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: newSubscription }),
        });
      })
  );
});