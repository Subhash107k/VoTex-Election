import React, { useState, useEffect } from "react";
import {
  Terminal,
  Copy,
  Trash2,
  Mail,
  RefreshCw,
  Layers,
  Check,
  Bell,
} from "lucide-react";
import { DispatchLog } from "../types.js";

export default function NotificationConsole() {
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("votex_token");
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const getUserRole = () => {
    try {
      const raw = localStorage.getItem("votex_user");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return String(parsed?.role || "").toLowerCase();
    } catch {
      return "";
    }
  };

  const fetchLogs = async () => {
    const headers = getAuthHeaders();
    const userRole = getUserRole();
    const isPrivileged = [
      "administrator",
      "super administrator",
      "election officer",
      "moderator",
      "verification officer",
      "support staff",
      "faq manager",
    ].includes(userRole);

    try {
      setLoading(true);

      if (!headers || !isPrivileged) {
        const res = await fetch("/api/system/dispatches/public");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        } else {
          setLogs([]);
        }
        return;
      }

      const res = await fetch("/api/system/dispatches", { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        setLogs([]);
      }
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await fetch("/api/system/dispatches/clear", {
        method: "POST",
        headers,
      });
      if (res.ok) {
        setLogs([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Poll for logs
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Extract OTP digits if present
  const extractOTP = (body: string): string => {
    const match = body.match(/\b\d{6}\b/);
    return match ? match[0] : "";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Toggle Button */}
      <button
        type="button"
        id="btn-toggle-notification-console"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-mono text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 font-semibold cursor-pointer transition-transform duration-300 active:scale-95"
      >
        <div className="relative">
          <Terminal className="w-4 h-4 animate-pulse" />
          {logs.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900 animate-bounce"></span>
          )}
        </div>
        <span>SMTP & SMS Console ({logs.length})</span>
      </button>

      {/* Drawer Container */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[360px] md:w-[420px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[500px]">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-mono text-xs font-bold uppercase tracking-wider">
                VoTex Communication Logger
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="p-1 text-slate-400 hover:text-white rounded transition-colors disabled:opacity-50 cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={clearLogs}
                className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                title="Clear buffer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white font-semibold text-xs ml-2 cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[220px]">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Terminal className="w-8 h-8 text-slate-800 mb-2" />
                <p className="text-[11px] text-slate-500 font-mono">
                  No communication packets captured.
                </p>
                <p className="text-[10px] text-slate-600 max-w-[240px] mt-1">
                  Triggers send operations upon voter registration, login
                  authentication requests, or voting ballot casting.
                </p>
              </div>
            ) : (
              logs.map((log) => {
                const otp = extractOTP(log.body);
                return (
                  <div
                    key={log.id}
                    className="bg-slate-900/60 rounded-xl p-3 border border-slate-850 hover:border-slate-800 transition-all flex flex-col gap-2 scale-98"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {log.type === "Email" ? (
                          <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" /> EMAIL
                          </span>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                            <Bell className="w-2.5 h-2.5" /> SMS OTP
                          </span>
                        )}
                        <span className="text-slate-500 text-[10px] font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {otp && (
                        <button
                          onClick={() => handleCopy(otp, log.id)}
                          className="flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded transition-all cursor-pointer border border-amber-500/20"
                        >
                          {copiedId === log.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied OTP!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>OTP: {otp}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="font-sans text-[11px]">
                      <div className="text-slate-400 font-semibold truncate">
                        Target: {log.to}
                      </div>
                      <div className="text-white font-medium mt-0.5 border-b border-slate-850/30 pb-1 mb-1 font-mono text-[10px]">
                        Subject: {log.title}
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap font-mono leading-relaxed text-[10px] bg-slate-950 p-2 rounded border border-slate-850">
                        {log.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer informational */}
          <div className="bg-slate-900 text-slate-500 text-[9px] font-mono px-4 py-2 text-center border-t border-slate-850 select-none">
            Secure sandbox dispatch proxy: active
          </div>
        </div>
      )}
    </div>
  );
}
