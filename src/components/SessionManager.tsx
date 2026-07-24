import React, { useState, useEffect, useRef } from "react";
import { ShieldAlert, LogOut, Check, HelpCircle, X } from "lucide-react";

interface SessionManagerProps {
  token: string | null;
  onLogout: (reason?: string) => void;
  onExtendSession: () => Promise<void>;
  userRole?: string;
}

export default function SessionManager({ token, onLogout, onExtendSession, userRole }: SessionManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 seconds warning countdown
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const warnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Time configurations (in milliseconds)
  const INACTIVITY_LIMIT = 20 * 60 * 1000; // 20 minutes
  const WARNING_THRESHOLD = 19 * 60 * 1000; // 19 minutes of inactivity triggers warning

  // Centralized logout operation
  const forceSecureLogout = (reason: string = "Session Expired") => {
    // Revoke the current token server-side when possible before clearing it locally.
    if (token) {
      void fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-VoTex-Session-Cleanup": "true",
        },
      }).catch(() => undefined);
    }

    // 1. Clear JWT and refresh configurations from LocalStorage
    localStorage.removeItem("votex_token");
    localStorage.removeItem("votex_refresh_token");
    
    // 2. Synchronize across tabs using storage event and BroadcastChannel
    try {
      localStorage.setItem("votex_force_logout_event", Date.now().toString());
    } catch (e) {}

    try {
      const channel = new BroadcastChannel("votex_session_sync");
      channel.postMessage({ type: "LOGOUT", reason });
    } catch (e) {}

    // 3. Clear all cached session storage
    try {
      sessionStorage.clear();
    } catch (e) {}

    // 4. Securely erase client cookies
    try {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
      }
    } catch (e) {}

    // 5. Invoke session cleanup on parent React state
    onLogout(reason);

    // 6. Hard refresh to cancel pending API requests and flush in-memory states/WebSocket connections
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  // Reset the inactivity timers
  const resetInactivityTimer = () => {
    if (!token) return;

    // Clear old timeouts
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningCountdownIntervalRef.current) clearInterval(warningCountdownIntervalRef.current);

    setShowWarning(false);
    setCountdown(60);

    // Set timeout to show warning at 19 minutes
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startWarningCountdown();
    }, WARNING_THRESHOLD);

    // Set timeout to automatically logout at 20 minutes
    logoutTimerRef.current = setTimeout(() => {
      forceSecureLogout("Session expired due to inactivity. Please log in again.");
    }, INACTIVITY_LIMIT);
  };

  const startWarningCountdown = () => {
    let timeLeft = 60;
    setCountdown(timeLeft);

    if (warningCountdownIntervalRef.current) {
      clearInterval(warningCountdownIntervalRef.current);
    }

    warningCountdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        if (warningCountdownIntervalRef.current) clearInterval(warningCountdownIntervalRef.current);
      }
    }, 1000);
  };

  const handleStayLoggedIn = async () => {
    try {
      // Refresh token or sync session with backend
      await onExtendSession();
      resetInactivityTimer();
    } catch (err) {
      console.error("Failed to extend session, logging out:", err);
      forceSecureLogout("Could not verify session active status.");
    }
  };

  // Setup Event Listeners for User Inactivity Tracking
  useEffect(() => {
    if (!token) {
      // Clear timers if user is not logged in
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningCountdownIntervalRef.current) clearInterval(warningCountdownIntervalRef.current);
      return;
    }

    // List of events that reset the inactivity timer
    const activityEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"];

    const handleUserActivity = () => {
      // If warning modal is actively showing, do not passively reset
      if (showWarning) return;
      resetInactivityTimer();
    };

    // Attach listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial timer starter
    resetInactivityTimer();

    // Listen to Storage events for multi-tab logout synchronization & active logout requests
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "votex_force_logout_event") {
        onLogout("Session closed on another browser tab.");
        setTimeout(() => window.location.reload(), 200);
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // BroadcastChannel for modern tab syncing
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("votex_session_sync");
      channel.onmessage = (e) => {
        if (e.data && e.data.type === "LOGOUT") {
          onLogout(e.data.reason || "Session synchronized logout.");
          setTimeout(() => window.location.reload(), 200);
        }
      };
    } catch (err) {}

    // Hook Global HTTP 401 Interceptor: Catch any API calls returning 401
    const originalFetch = window.fetch;
    let fetchOverridden = false;

    const customFetch = async function (...args: any[]) {
      try {
        const response = await originalFetch(...(args as [any, any]));
        const requestOptions = args[1] as RequestInit | undefined;
        const headers = new Headers(requestOptions?.headers);
        if (
          response.status === 401 &&
          headers.get("X-VoTex-Session-Cleanup") !== "true"
        ) {
          console.warn("API returned 401 Unauthorized. Forcing secure logout...");
          forceSecureLogout("Your token has expired or is invalid. Please log in again.");
        }
        return response;
      } catch (error) {
        throw error;
      }
    };

    try {
      window.fetch = customFetch;
      fetchOverridden = true;
    } catch (e) {
      try {
        Object.defineProperty(window, "fetch", {
          value: customFetch,
          configurable: true,
          writable: true,
          enumerable: true
        });
        fetchOverridden = true;
      } catch (err) {
        console.warn("Could not override global fetch in this sandbox environment:", err);
      }
    }

    // Cleanup function
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorageEvent);
      if (channel) {
        channel.close();
      }
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningCountdownIntervalRef.current) clearInterval(warningCountdownIntervalRef.current);
      
      // Restore default fetch implementation to prevent memory leaks
      if (fetchOverridden) {
        try {
          window.fetch = originalFetch;
        } catch (e) {
          try {
            Object.defineProperty(window, "fetch", {
              value: originalFetch,
              configurable: true,
              writable: true,
              enumerable: true
            });
          } catch (err) {
            console.error("Could not restore original fetch implementation:", err);
          }
        }
      }
    };
  }, [token, showWarning]);

  // Handle intercept of manual logout
  // Setup a custom custom confirm box interceptor on the window if desirable
  useEffect(() => {
    if (!token) return;

    // We can intercept the logout buttons by exposing a portal or global trigger.
    // Let's listen to custom events for manual logout confirmation
    const handleLogoutClickEvent = (e: CustomEvent) => {
      e.preventDefault();
      setShowLogoutConfirm(true);
    };

    window.addEventListener("trigger_votex_logout_confirm", handleLogoutClickEvent as EventListener);

    return () => {
      window.removeEventListener("trigger_votex_logout_confirm", handleLogoutClickEvent as EventListener);
    };
  }, [token]);

  if (!token) return null;

  return (
    <>
      {/* 20 Minute Inactivity Warning Modal Drawer Overlay */}
      {showWarning && (
        <div id="session-warning-modal" className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-amber-100 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Inactivity Warning</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  You have been inactive for over <span className="font-bold">19 minutes</span>. For your secure voting protection, you will be automatically signed out soon.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3.5 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-center my-4">
              <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Terminating session in:</span>
              <span className="text-2xl font-black text-rose-500">{countdown} seconds</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
              <button
                type="button"
                id="btn-session-logout"
                onClick={() => forceSecureLogout("Logged out by user.")}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Now</span>
              </button>

              <button
                type="button"
                id="btn-session-extend"
                onClick={handleStayLoggedIn}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Stay Signed In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Logout Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div id="logout-confirm-modal" className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl shrink-0">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-rose-100 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Secure Exit Command</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to end your active secure session? This will destroy all local biometric templates, decrypt keys, and sign out on this device.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
              <button
                type="button"
                id="btn-confirm-cancel"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-logout"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  forceSecureLogout("Logged out successfully.");
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Sign-Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
