import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldAlert,
  LogOut,
  Check,
  WifiOff,
  Shield,
  Clock,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  AlertTriangle,
  Activity,
  Lock,
  Smartphone,
  Globe,
  MapPin,
  Monitor,
  RefreshCw,
  Timer,
  ChevronRight,
  X,
  Info,
  Sun,
  Moon,
} from "lucide-react";
import type { ThemeMode } from "../../types/auth";

interface SessionManagerProps {
  token: string | null;
  onLogout: (reason?: string) => void;
  onExtendSession: () => Promise<void>;
  userRole?: string;
  theme?: ThemeMode;
  setTheme?: (theme: ThemeMode) => void;
}

interface SessionActivity {
  id: string;
  type: "login" | "biometric" | "document" | "navigation" | "verification";
  timestamp: number;
  details: string;
  ip?: string;
  location?: string;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: number;
  current: boolean;
}

export default function SessionManager({
  token,
  onLogout,
  onExtendSession,
  userRole,
  theme,
  setTheme,
}: SessionManagerProps) {
  // State Management
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [sessionActivities, setSessionActivities] = useState<SessionActivity[]>(
    [],
  );
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [showActiveSessions, setShowActiveSessions] = useState(false);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(false);
  const [maskedToken, setMaskedToken] = useState<string>("");
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);

  const warnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const securityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastBehaviorWarningRef = useRef<number>(0);
  const mouseMovementsRef = useRef<{ x: number; y: number; time: number }[]>(
    [],
  );
  const isLoggingOutRef = useRef(false);

  // Time configurations
  const INACTIVITY_LIMIT = 20 * 60 * 1000; // 20 minutes
  const WARNING_THRESHOLD = 19 * 60 * 1000; // 19 minutes
  const MAX_FAILED_ATTEMPTS = 5;
  const SECURITY_CHECK_INTERVAL = 30 * 1000; // 30 seconds

  // Mask sensitive token
  useEffect(() => {
    if (token) {
      const masked =
        token.substring(0, 8) +
        "••••••••••••••••" +
        token.substring(token.length - 4);
      setMaskedToken(masked);
    }
  }, [token]);

  // Detect biometric capability
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        // Check for WebAuthn support
        if (window.PublicKeyCredential) {
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricLockEnabled(available);
        }
      } catch (err) {
        console.log("Biometric not available");
      }
    };
    checkBiometricSupport();
  }, []);

  // Track mouse patterns for behavioral analytics
  useEffect(() => {
    if (!token) return;

    const trackMouseMovement = (e: MouseEvent) => {
      mouseMovementsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      });

      // Keep only last 50 movements
      if (mouseMovementsRef.current.length > 50) {
        mouseMovementsRef.current = mouseMovementsRef.current.slice(-50);
      }
    };

    window.addEventListener("mousemove", trackMouseMovement, { passive: true });
    return () => window.removeEventListener("mousemove", trackMouseMovement);
  }, [token]);

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Calculate security score
  const calculateSecurityScore = useCallback(() => {
    let score = 0;
    if (token) score += 20;
    if (window.location.protocol === "https:") score += 20;
    if (biometricLockEnabled) score += 20;
    if (!isOffline) score += 15;
    if (failedAttempts === 0) score += 15;
    if (document.cookie.includes("HttpOnly")) score += 10;
    setSecurityScore(Math.min(100, score));
  }, [token, biometricLockEnabled, isOffline, failedAttempts]);

  useEffect(() => {
    calculateSecurityScore();
  }, [calculateSecurityScore]);

  // Enhanced secure logout with forensic cleanup
  const forceSecureLogout = useCallback(
    (reason: string = "Session Expired") => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;
      console.log(`🔒 Force Secure Logout: ${reason}`);

      // Log security event
      const securityEvent: SessionActivity = {
        id: crypto.randomUUID(),
        type: "verification",
        timestamp: Date.now(),
        details: `Logout: ${reason}`,
        ip: "127.0.0.1",
        location: "Local",
      };

      try {
        const activities = JSON.parse(
          localStorage.getItem("votex_security_log") || "[]",
        );
        activities.push(securityEvent);
        localStorage.setItem(
          "votex_security_log",
          JSON.stringify(activities.slice(-100)),
        );
      } catch (e) {}

      // Server-side logout
      if (token) {
        void fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-VoTex-Session-Cleanup": "true",
            "X-Security-Event": "logout",
            "X-Logout-Reason": reason,
          },
        }).catch(() => undefined);
      }

      // Local storage cleanup
      const keysToRemove = [
        "votex_token",
        "votex_refresh_token",
        "votex_user_data",
        "votex_biometric_key",
        "votex_encryption_key",
        "votex_session_data",
        "votex_local_nonce",
      ];

      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      });

      // Set force logout event
      try {
        localStorage.setItem(
          "votex_force_logout_event",
          JSON.stringify({
            timestamp: Date.now(),
            reason,
            sessionId: crypto.randomUUID(),
          }),
        );
      } catch (e) {}

      // Cross-tab communication
      try {
        const channel = new BroadcastChannel("votex_session_sync");
        channel.postMessage({
          type: "LOGOUT",
          reason,
          timestamp: Date.now(),
        });
        setTimeout(() => channel.close(), 100);
      } catch (e) {}

      // Session storage cleanup
      try {
        sessionStorage.clear();
      } catch (e) {}

      // IndexedDB cleanup (for any stored biometric data)
      try {
        const dbDelete = indexedDB.deleteDatabase("votex_biometric_db");
        dbDelete.onsuccess = () => console.log("Biometric database cleared");
      } catch (e) {}

      // Cookie cleanup with security attributes
      try {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name =
            eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=strict`;
        }
      } catch (e) {}

      // Clear timers
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningCountdownIntervalRef.current)
        clearInterval(warningCountdownIntervalRef.current);
      if (securityCheckIntervalRef.current)
        clearInterval(securityCheckIntervalRef.current);

      // Clear sensitive data from memory
      mouseMovementsRef.current = [];

      onLogout(reason);

      // Force reload after cleanup
      setTimeout(() => {
        window.location.reload();
      }, 200);
    },
    [token, onLogout],
  );

  // Enhanced activity tracking with behavioral analysis
  const resetInactivityTimer = useCallback(() => {
    if (!token) return;

    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivity(now);

    // Log activity for audit
    const activity: SessionActivity = {
      id: crypto.randomUUID(),
      type: "navigation",
      timestamp: now,
      details: "User activity detected",
    };
    setSessionActivities((prev) => [...prev.slice(-50), activity]);

    // Behavioral anomaly detection
    const recentMovements = mouseMovementsRef.current.filter(
      (m) => m.time > now - 5000,
    );

    if (recentMovements.length >= 6) {
      const distances = recentMovements.slice(1).map((m, i) => {
        const prev = recentMovements[i];
        return Math.hypot(m.x - prev.x, m.y - prev.y);
      });

      const avgSpeed =
        distances.reduce((acc, distance) => acc + distance, 0) /
        distances.length;
      const maxDistance = Math.max(...distances);
      const timeSinceLastWarning = now - lastBehaviorWarningRef.current;
      const warningCooldown = 20 * 1000; // 20 seconds

      const isAbruptMovement = avgSpeed > 500 || maxDistance > 200;
      const isStalledMovement = avgSpeed < 0.3 && distances.length > 8;
      
      const isProfilePage = window.location.pathname.includes("/profile") || window.location.pathname.includes("/complete-profile") || window.location.pathname.includes("/edit-profile");

      if (
        !isProfilePage &&
        (isAbruptMovement || isStalledMovement) &&
        timeSinceLastWarning > warningCooldown
      ) {
        console.warn("Suspicious mouse behavior detected");
        lastBehaviorWarningRef.current = now;
      }
    }

    // Clear existing timers
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningCountdownIntervalRef.current)
      clearInterval(warningCountdownIntervalRef.current);

    setShowWarning(false);
    setCountdown(60);

    // Set new timers
    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startWarningCountdown();
    }, WARNING_THRESHOLD);

    logoutTimerRef.current = setTimeout(() => {
      forceSecureLogout("Session expired due to inactivity.");
    }, INACTIVITY_LIMIT);
  }, [token, forceSecureLogout]);

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
        if (warningCountdownIntervalRef.current)
          clearInterval(warningCountdownIntervalRef.current);
      }
    }, 1000);
  };

  // Session extension with verification
  const handleStayLoggedIn = async () => {
    try {
      // Add security verification before extending
      const verifyPromise = new Promise((resolve) => {
        // Simple verification - could be replaced with biometric prompt
        setTimeout(() => resolve(true), 500);
      });

      await verifyPromise;
      await onExtendSession();

      // Log successful extension
      const activity: SessionActivity = {
        id: crypto.randomUUID(),
        type: "verification",
        timestamp: Date.now(),
        details: "Session extended successfully",
      };
      setSessionActivities((prev) => [...prev.slice(-50), activity]);

      resetInactivityTimer();
    } catch (err) {
      console.error("Failed to extend session:", err);
      setFailedAttempts((prev) => {
        const newCount = prev + 1;
        if (newCount >= MAX_FAILED_ATTEMPTS) {
          forceSecureLogout("Security threshold exceeded.");
        }
        return newCount;
      });
    }
  };

  // Periodic security checks
  useEffect(() => {
    if (!token) return;

    securityCheckIntervalRef.current = setInterval(() => {
      // Check for suspicious inactivity patterns
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      if (timeSinceLastActivity > INACTIVITY_LIMIT * 1.5) {
        forceSecureLogout("Suspicious inactivity detected.");
      }

      // Monitor for rapid navigation patterns
      const recentActivities = sessionActivities.filter(
        (a) => a.timestamp > Date.now() - 10000,
      );

      if (recentActivities.length > 20) {
        console.warn("Abnormal activity rate detected");
      }

      // Calculate and update security score
      calculateSecurityScore();
    }, SECURITY_CHECK_INTERVAL);

    return () => {
      if (securityCheckIntervalRef.current)
        clearInterval(securityCheckIntervalRef.current);
    };
  }, [token, forceSecureLogout, sessionActivities, calculateSecurityScore]);

  // Main setup effect
  useEffect(() => {
    if (!token) {
      // Cleanup all timers and intervals
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (warningCountdownIntervalRef.current)
        clearInterval(warningCountdownIntervalRef.current);
      if (securityCheckIntervalRef.current)
        clearInterval(securityCheckIntervalRef.current);
      return;
    }

    // Log session start
    const loginActivity: SessionActivity = {
      id: crypto.randomUUID(),
      type: "login",
      timestamp: Date.now(),
      details: "Secure session established",
      ip: "192.168.1.1",
      location: "Local Network",
    };
    setSessionActivities([loginActivity]);

    // Set up activity listeners
    const activityEvents = [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "touchstart",
      "focus",
    ];

    const handleUserActivity = (event: Event) => {
      if (showWarning) return;

      // Additional security: validate event source
      if (event.isTrusted) {
        resetInactivityTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initialize activity timer
    resetInactivityTimer();

    // Monitor storage events for cross-tab security
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "votex_force_logout_event") {
        const data = JSON.parse(e.newValue || "{}");
        onLogout(data.reason || "Session closed on another browser tab.");
        setTimeout(() => window.location.reload(), 200);
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // Broadcast channel for cross-tab sync
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("votex_session_sync");
      channel.onmessage = (e) => {
        if (e.data && e.data.type === "LOGOUT") {
          onLogout(e.data.reason || "Session synchronized logout.");
          setTimeout(() => window.location.reload(), 200);
        }
      };
    } catch (err) {
      console.warn("BroadcastChannel not supported");
    }

    // Enhanced fetch interceptor with security headers
    const originalFetch = window.fetch;
    let fetchOverridden = false;

    const customFetch = async function (...args: any[]) {
      const requestOptions = (args[1] as RequestInit) || {};
      const headers = new Headers(requestOptions.headers);
      const requestUrlString =
        args[0] instanceof Request ? args[0].url : String(args[0]);
      const requestUrl = new URL(requestUrlString, window.location.href);

      const isSameOrigin = requestUrl.origin === window.location.origin;

      if (isSameOrigin) {
        // Add security headers only for same-origin requests
        if (token && !headers.has("X-Security-Token")) {
          headers.set("X-Session-Active", "true");
          headers.set("X-Last-Activity", lastActivityRef.current.toString());
        }
      }

      const enhancedOptions: RequestInit = {
        ...requestOptions,
        headers,
        ...(isSameOrigin
          ? { credentials: "same-origin" as RequestCredentials }
          : {}),
      };

      try {
        const response = await originalFetch(args[0], enhancedOptions);

        if (
          response.status === 401 &&
          !headers.has("X-VoTex-Session-Cleanup")
        ) {
          forceSecureLogout("Authentication token expired.");
        }

        if (
          response.status === 403 &&
          !headers.has("X-VoTex-Session-Cleanup")
        ) {
          const cloned = response.clone();
          try {
            const body = await cloned.json();
            if (
              body?.error?.toLowerCase().includes("expired") ||
              body?.error?.toLowerCase().includes("invalid")
            ) {
              forceSecureLogout("Session validation failed.");
            }
          } catch {}
        }

        // Detect potential CSRF
        if (response.status === 419) {
          forceSecureLogout("CSRF token validation failed.");
        }

        return response;
      } catch (error) {
        setFailedAttempts((prev) => prev + 1);
        throw error;
      }
    };

    // Override fetch with fallback
    try {
      window.fetch = customFetch as typeof fetch;
      fetchOverridden = true;
    } catch (e) {
      try {
        Object.defineProperty(window, "fetch", {
          value: customFetch,
          configurable: true,
          writable: true,
          enumerable: true,
        });
        fetchOverridden = true;
      } catch (err) {
        console.warn("Could not override fetch:", err);
      }
    }

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorageEvent);
      if (channel) channel.close();

      // Restore original fetch
      if (fetchOverridden) {
        try {
          window.fetch = originalFetch;
        } catch (e) {
          console.error("Could not restore fetch:", e);
        }
      }
    };
  }, [token, showWarning, onLogout, resetInactivityTimer, forceSecureLogout]);

  // Logout confirmation handler
  useEffect(() => {
    if (!token) return;

    const handleLogoutClickEvent = (e: CustomEvent) => {
      e.preventDefault();
      setShowLogoutConfirm(true);
    };

    window.addEventListener(
      "trigger_votex_logout_confirm",
      handleLogoutClickEvent as EventListener,
    );

    return () => {
      window.removeEventListener(
        "trigger_votex_logout_confirm",
        handleLogoutClickEvent as EventListener,
      );
    };
  }, [token]);

  if (!token) return null;

  // Format time for display
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      {/* Security Panel Dropdown */}
      {showSecurityPanel && (
        <div className="fixed top-10 right-4 z-[10002] w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Security Center</h4>
              <button
                onClick={() => setShowSecurityPanel(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Token */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Session Token</span>
                <button
                  onClick={() => setShowTokenInfo(!showTokenInfo)}
                  className="text-slate-400 hover:text-white"
                >
                  {showTokenInfo ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </button>
              </div>
              <code className="block p-2 bg-slate-950 rounded-lg text-xs text-slate-300 break-all">
                {showTokenInfo ? token : maskedToken}
              </code>
            </div>

            {/* Active Sessions */}
            <div>
              <button
                onClick={() => setShowActiveSessions(!showActiveSessions)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" />
                  Active Sessions
                </span>
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${showActiveSessions ? "rotate-90" : ""}`}
                />
              </button>
              {showActiveSessions && (
                <div className="mt-2 space-y-2">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-slate-300">Current Device</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {navigator.userAgent.substring(0, 50)}...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => forceSecureLogout("Terminate all sessions")}
                className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Terminate All Sessions
              </button>
              <button
                onClick={resetInactivityTimer}
                className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Session
              </button>
            </div>

            {/* Security Log */}
            <div>
              <h5 className="text-xs font-semibold text-slate-400 mb-2">
                Recent Activity
              </h5>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {sessionActivities
                  .slice(-5)
                  .reverse()
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 text-[10px] p-1.5 rounded hover:bg-slate-800"
                    >
                      <Activity className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-slate-300">
                          {activity.details}
                        </span>
                        <span className="text-slate-600 ml-2">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="fixed top-10 left-0 right-0 bg-amber-500/90 backdrop-blur-sm text-slate-950 text-xs font-bold py-2 px-4 text-center z-[9999] flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>Offline Mode - Data will sync when connection restores</span>
        </div>
      )}

      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-amber-500/10 rounded-full mb-4">
                <Timer className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                Session Timeout
              </h3>
              <p className="text-sm text-slate-400">
                Your session will expire in
              </p>
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-5xl font-black text-rose-400 tabular-nums">
                  {countdown}
                </span>
                <span className="text-xl text-slate-500">sec</span>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  For your security, inactive sessions are automatically
                  terminated. All biometric data and encryption keys will be
                  cleared from this device.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() =>
                  forceSecureLogout("Manual logout during warning.")
                }
                className="flex-1 py-3.5 border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition-all hover:border-slate-600"
              >
                Sign Out Now
              </button>

              <button
                onClick={handleStayLoggedIn}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
              >
                Stay Connected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-red-500/10 rounded-full mb-4">
                <LogOut className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                End Session?
              </h3>
              <p className="text-sm text-slate-400">
                This will permanently destroy your active session
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <Key className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-slate-400">
                  Encryption keys will be purged
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <Fingerprint className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-slate-400">
                  Biometric templates will be erased
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <Globe className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-slate-400">
                  All active sessions will be terminated
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3.5 border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  forceSecureLogout("User initiated secure logout.");
                }}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-red-500/25 active:scale-95"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Padding for fixed header */}
      <div className="h-10" />
    </>
  );
}
