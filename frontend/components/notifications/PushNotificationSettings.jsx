"use client";
import { useState } from "react";
import { Bell, BellOff, BellRing, Loader2, AlertCircle, CheckCircle2, Trash2, Sparkles } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import api from "@/lib/api";

export default function PushNotificationSettings({ onCleanup }) {
  const { supported, swReady, subscribed, permission, loading, error, subscribe, unsubscribe } =
    usePushNotifications();
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState(null);
  const [testSent, setTestSent] = useState(false);

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanMsg(null);
    try {
      const { data } = await api.post("/notifications/cleanup-duplicates");
      setCleanMsg(data.message);
      onCleanup?.();
    } catch (_) {
      setCleanMsg("Cleanup failed — try again");
    } finally {
      setCleaning(false);
    }
  };

  const handleTestPush = async () => {
    try {
      await api.post("/notifications/fun");
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (_) {}
  };

  const statusConfig = (() => {
    if (!supported)              return { icon: <BellOff size={15} className="text-slate-600" />,     bg: "bg-surface-3",     text: "Not supported in this browser" };
    if (permission === "denied") return { icon: <AlertCircle size={15} className="text-red-400" />,   bg: "bg-red-500/10",    text: "Blocked — go to Site Settings → Notifications → Allow" };
    if (subscribed)              return { icon: <BellRing size={15} className="text-green-400" />,    bg: "bg-green-500/15",  text: "Active — notifications will appear on your phone/desktop" };
    return                              { icon: <Bell size={15} className="text-slate-500" />,         bg: "bg-surface-3",     text: "Enable to get notified outside the app" };
  })();

  return (
    <div className="rounded-xl border border-surface-3 bg-surface-2 overflow-hidden mb-5">

      {/* Push toggle row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${statusConfig.bg}`}>
            {statusConfig.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Push Notifications</p>
            <p className="text-xs text-slate-500 leading-snug max-w-xs">{statusConfig.text}</p>
            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle size={10} /> {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {subscribed && (
            <button
              onClick={handleTestPush}
              title="Send a test notification to your device"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-3 text-slate-400 hover:text-purple-400 text-xs transition-colors"
            >
              {testSent ? <CheckCircle2 size={12} className="text-green-400" /> : <Sparkles size={12} />}
              {testSent ? "Sent!" : "Test"}
            </button>
          )}
          {supported && permission !== "denied" && (
            <button
              onClick={subscribed ? unsubscribe : subscribe}
              disabled={loading || !swReady}
              title={!swReady ? "Initializing service worker…" : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                subscribed
                  ? "bg-surface-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }`}
            >
              {loading
                ? <Loader2 size={12} className="animate-spin" />
                : subscribed
                  ? <><BellOff size={12} /> Disable</>
                  : <><Bell size={12} /> Enable</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Cleanup duplicates row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-surface-3/60 bg-surface-1/40">
        <div>
          <p className="text-xs text-slate-500">Seeing duplicate overdue notifications?</p>
          {cleanMsg && <p className="text-xs text-green-400 mt-0.5">✓ {cleanMsg}</p>}
        </div>
        <button
          onClick={handleCleanup}
          disabled={cleaning}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-3 text-slate-500 hover:text-slate-200 text-xs transition-colors disabled:opacity-50"
        >
          {cleaning ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
          Clean up
        </button>
      </div>
    </div>
  );
}
