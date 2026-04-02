"use client";
import { Bell, BellOff, BellRing, Loader2, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function PushNotificationSettings() {
  const { supported, subscribed, permission, loading, error, subscribe, unsubscribe } =
    usePushNotifications();

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-2 border border-surface-3 mb-5">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          subscribed ? "bg-green-500/15" : "bg-surface-3"
        }`}>
          {subscribed
            ? <BellRing size={15} className="text-green-400" />
            : <BellOff size={15} className="text-slate-500" />
          }
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">Push Notifications</p>
          <p className="text-xs text-slate-500">
            {subscribed
              ? "You'll get notified even when SahilOS is closed"
              : permission === "denied"
              ? "Blocked in browser — check site settings"
              : "Get notified for tasks, habits & achievements"}
          </p>
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
              <AlertCircle size={10} /> {error}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading || permission === "denied"}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          subscribed
            ? "bg-surface-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            : "bg-indigo-600 text-white hover:bg-indigo-500"
        }`}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : subscribed ? (
          <><BellOff size={12} /> Disable</>
        ) : (
          <><Bell size={12} /> Enable</>
        )}
      </button>
    </div>
  );
}
