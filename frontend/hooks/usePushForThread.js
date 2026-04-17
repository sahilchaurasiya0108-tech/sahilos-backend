"use client";
/**
 * usePushForThread — SahilOS
 *
 * Registers a Web Push subscription with the Red Thread server so that
 * when Gauri sends a message and Sahil's app is closed / phone locked,
 * the OS delivers a push notification directly to the device.
 *
 * This is separate from SahilOS's own push system (which targets the
 * SahilOS backend). This hook talks to the Red Thread server's
 * /push/subscribe endpoint.
 *
 * Mount once — e.g. inside the /thread page or the layout.
 * Call subscribe() after the user grants permission.
 */

import { useState, useEffect, useCallback } from "react";

const THREAD_SERVER =
  process.env.NEXT_PUBLIC_RED_THREAD_URL || "http://localhost:4000";

const USER_ID = "sahil";
const STORAGE_KEY = "sahilos_thread_push_subscribed";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushForThread() {
  const [supported, setSupported]   = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      setSubscribed(localStorage.getItem(STORAGE_KEY) === "true");
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Notification permission denied.");
        return;
      }

      // 2. Fetch VAPID public key from Red Thread server
      const vapidRes = await fetch(`${THREAD_SERVER}/push/vapid-key`);
      const vapidData = await vapidRes.json();
      if (!vapidData.publicKey) {
        setError("Push not configured on Red Thread server.");
        return;
      }

      // 3. Register SW (reuse existing SahilOS SW or register the thread SW)
      const reg = await navigator.serviceWorker.ready;

      // 4. If there's an existing subscription with a DIFFERENT applicationServerKey
      //    (i.e. SahilOS's own VAPID key), we must unsubscribe it first — the browser
      //    throws InvalidStateError if you try to subscribe with a different key.
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // 5. Subscribe via PushManager with the Red Thread VAPID key
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      // 6. Send to Red Thread server
      await fetch(`${THREAD_SERVER}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, subscription }),
      });

      setSubscribed(true);
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (err) {
      console.error("thread push subscribe error:", err);
      setError(err.message || "Failed to enable push notifications.");
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`${THREAD_SERVER}/push/unsubscribe`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, subscribed, permission, loading, error, subscribe, unsubscribe };
}