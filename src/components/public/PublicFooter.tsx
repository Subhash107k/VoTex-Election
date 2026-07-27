import React, { useState } from "react";
import { Vote, Mail, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

interface PublicFooterProps {
  setCurrentPath: (path: string) => void;
}

export default function PublicFooter({ setCurrentPath }: PublicFooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleNav = (pathStr: string) => {
    setCurrentPath(pathStr);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setNewsletterEmail("");
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-850 pt-16 pb-12 font-sans text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-slate-950 font-black">
                <Vote className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">VoTex Election System</span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Next-generation election infrastructure featuring cryptographic ballot verification, webcam face liveness detection, and zero-knowledge voter privacy.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Certified Cryptographic Election Engine</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Home Landing", path: "/" },
                { label: "Active Elections", path: "/elections" },
                { label: "Live Election Results", path: "/results" },
                { label: "Voter Registration", path: "/register" },
                { label: "Account Sign In", path: "/login" },
              ].map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Support & Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Resources & Legal
            </h4>
            <ul className="space-y-2">
              {[
                { label: "FAQ & Help Center", path: "/faq" },
                { label: "Contact Support", path: "/contact" },
                { label: "System Documentation", path: "/documentation" },
                { label: "Privacy Policy", path: "/privacy" },
                { label: "Terms of Service", path: "/terms" },
                { label: "Administrator Login", path: "/admin/login" },
              ].map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className="hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Election Bulletins
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Subscribe to official election announcements and verification notices.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer"
              >
                Subscribe
              </button>
            </form>

            {newsletterSuccess && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Subscribed successfully!</span>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} VoTex Election Platform. All rights reserved.
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => handleNav("/privacy")} className="hover:text-slate-300">
              Privacy
            </button>
            <button type="button" onClick={() => handleNav("/terms")} className="hover:text-slate-300">
              Terms
            </button>
            <button type="button" onClick={() => handleNav("/contact")} className="hover:text-slate-300">
              Support
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
