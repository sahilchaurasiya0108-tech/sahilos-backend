"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [swReady, setSwReady]     = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // ── Check browser support ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  // ── Register service worker ────────────────────────────────────────────────
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("✅ SW registered, scope:", reg.scope);
        return navigator.serviceWorker.ready;
      })
      .then(() => setSwReady(true))
      .catch((err) => {
        console.error("SW registration failed:", err);
        setError("Service worker failed to register");
      });
  }, [supported]);

  // ── Check existing subscription ────────────────────────────────────────────
  useEffect(() => {
    if (!swReady) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, [swReady]);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!supported || !swReady) {
      setError("Browser not ready. Try again in a moment.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError(
          perm === "denied"
            ? "Blocked by browser. Go to Site Settings → Notifications → Allow."
            : "Permission not granted."
        );
        return;
      }

      // 2. Get VAPID public key
      const { data: vapidData } = await api.get("/notifications/vapid-key");
      if (!vapidData.publicKey) {
        setError(
          "Push not configured on server. Add VAPID keys to backend .env"
        );
        return;
      }

      // 3. Subscribe via PushManager
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      // 4. Send subscription to backend
      await api.post("/notifications/subscribe", { subscription });
      setSubscribed(true);
      console.log("✅ Push subscription saved");

      // 5. Send a test push so user sees it immediately
      try {
        await api.post("/notifications/fun");
      } catch (_) {}
    } catch (err) {
      console.error("Push subscribe error:", err);
      if (err.name === "NotAllowedError") {
        setError("Permission denied by browser.");
      } else if (err.message?.includes("applicationServerKey")) {
        setError("Invalid VAPID key — check server config.");
      } else {
        setError(err.message || "Failed to enable push notifications.");
      }
    } finally {
      setLoading(false);
    }
  }, [supported, swReady]);

  // ── Unsubscribe ────────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete("/notifications/unsubscribe", {
          data: { endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported,
    swReady,
    subscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}
