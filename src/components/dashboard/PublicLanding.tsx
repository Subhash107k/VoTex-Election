import React, { useState, useEffect } from "react";
import { Vote, RefreshCw, Calendar } from "lucide-react";
import PublicNavbar from "../public/PublicNavbar.tsx";
import Hero from "../public/Hero.tsx";
import Features from "../public/Features.tsx";
import StatsSection from "../public/StatsSection.tsx";
import FaqSection from "../public/FaqSection.tsx";
import CtaSection from "../public/CtaSection.tsx";
import PublicFooter from "../public/PublicFooter.tsx";
import ElectionResults from "./ElectionResults.tsx";
import PublicFaqPage from "./PublicFaqPage.tsx";
import PublicContactPage from "./PublicContactPage.tsx";
import PublicDocsPage from "./PublicDocsPage.tsx";
import type { PublicLandingProps } from "../../types/auth.ts";

export default function PublicLanding({
  currentPath,
  setCurrentPath,
  theme,
  setTheme,
}: PublicLandingProps) {
  const [stats, setStats] = useState({
    registeredVoters: 0,
    verifiedVoters: 0,
    electionsConducted: 0,
    candidates: 0,
    votesCast: 0,
  });

  const [elections, setElections] = useState<any[]>([]);
  const [electionsLoading, setElectionsLoading] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const statsRes = await fetch("/api/public/stats");
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson);
        }
      } catch (e) {
        console.error("Failed to load platform stats:", e);
      }

      try {
        setElectionsLoading(true);
        const electRes = await fetch("/api/elections");
        if (electRes.ok) {
          const electJson = await electRes.json();
          const electionItems = Array.isArray(electJson.elections)
            ? electJson.elections
            : [];
          const publicElections = electionItems.filter(
            (el: any) => el.status === "Active" || el.status === "Closed",
          );
          setElections(publicElections);
        }
      } catch (e) {
        console.error("Failed to download active list:", e);
      } finally {
        setElectionsLoading(false);
      }
    };

    fetchPublicData();
  }, [currentPath]);

  const handleNav = (pathStr: string) => {
    setCurrentPath(pathStr);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLight = theme === "light";
  const bgMain = isLight
    ? "bg-slate-50 text-slate-800"
    : "bg-slate-900 text-slate-100";
  const bgCard = isLight
    ? "bg-white border-slate-200/80 shadow-sm"
    : "bg-slate-950 border-slate-850 shadow-2xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div
      className={`min-h-screen ${bgMain} flex flex-col justify-between transition-colors duration-300 font-sans`}
    >
      {/* Shared Public Navbar */}
      <PublicNavbar
        currentPath={currentPath}
        setCurrentPath={setCurrentPath}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Content Sections based on Public Routes */}
      <main className="flex-1">
        {/* ==================== 1: HOME MARKETING LANDING ==================== */}
        {(currentPath === "/" ||
          currentPath === "" ||
          currentPath === "/home") && (
          <div className="space-y-0">
            <Hero
              onRegisterClick={() => handleNav("/register")}
              onLoginClick={() => handleNav("/login")}
              onResultsClick={() => handleNav("/results")}
            />
            <StatsSection stats={stats} />
            <Features />
            <FaqSection />
            <CtaSection
              onRegisterClick={() => handleNav("/register")}
              onLoginClick={() => handleNav("/login")}
            />
          </div>
        )}

        {/* ==================== 2: PUBLIC ELECTIONS CATALOG ==================== */}
        {currentPath === "/elections" && (
          <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 md:px-8">
            <button
              onClick={() => handleNav("/")}
              className={`mb-6 text-xs font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer ${textMuted}`}
            >
              <span>← Back to home</span>
            </button>

            <div className="text-left mb-12">
              <span className="text-[10px] text-teal-500 font-mono font-extrabold tracking-widest block uppercase mb-1">
                Public Elections Catalog
              </span>
              <h1
                className={`text-3xl md:text-4xl font-black ${textTitle} tracking-tight`}
              >
                Active & Concluded Elections
              </h1>
              <p className={`text-xs ${textMuted} mt-2 max-w-2xl`}>
                Review active elections, authenticate to cast your ballot, and
                view published results.
              </p>
            </div>

            {electionsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                <span className="text-xs text-slate-400 font-mono">
                  Loading public elections...
                </span>
              </div>
            ) : elections.length === 0 ? (
              <div
                className={`p-12 rounded-2xl text-center border ${bgCard} max-w-md mx-auto`}
              >
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className={`font-extrabold ${textTitle} text-sm`}>
                  No active elections right now
                </h3>
                <p className={`text-xs ${textMuted} mt-1`}>
                  Check back soon or sign in to view upcoming schedules.
                </p>
                <button
                  onClick={() => handleNav("/")}
                  className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-xs font-semibold rounded-lg text-white hover:opacity-90 cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {elections.map((el: any) => {
                  const isActive = el.status === "Active";
                  return (
                    <div
                      key={el.id}
                      className={`p-6 rounded-2xl border ${bgCard} flex flex-col justify-between hover:scale-[1.01] hover:border-emerald-500/20 transition-all duration-300`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span
                            className={`px-2.5 py-1 text-[9px] font-bold font-mono rounded-full uppercase leading-none ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-slate-500/10 text-slate-400"
                            }`}
                          >
                            {el.status}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold ${textMuted} uppercase`}
                          >
                            {el.type}
                          </span>
                        </div>

                        <h4
                          className={`font-extrabold text-sm ${textTitle} leading-snug mb-2`}
                        >
                          {el.title}
                        </h4>
                        <p
                          className={`text-[10px] leading-relaxed mb-4 ${textMuted}`}
                        >
                          {el.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-2">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mb-4">
                          <span>
                            Starts:{" "}
                            {el.startDate
                              ? new Date(el.startDate).toLocaleString()
                              : "TBD"}
                          </span>
                          <span>
                            Ends:{" "}
                            {el.endDate
                              ? new Date(el.endDate).toLocaleString()
                              : "TBD"}
                          </span>
                        </div>

                        {isActive ? (
                          <button
                            onClick={() => handleNav("/login")}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs rounded-xl uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Vote className="w-3.5 h-3.5" />
                            <span>Sign In & Cast Ballot</span>
                          </button>
                        ) : (
                          <div className="text-center p-2 bg-slate-100 dark:bg-slate-900 rounded-lg">
                            <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase">
                              ELECTION DISMISSED (ENDED)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ==================== 3: LIVE RESULTS ROUTE ==================== */}
        {currentPath === "/results" && (
          <div className="py-8 max-w-7xl mx-auto px-4 md:px-8">
            <ElectionResults onBack={() => handleNav("/")} isLight={isLight} />
          </div>
        )}

        {/* ==================== 4: FAQ ROUTE ==================== */}
        {currentPath === "/faq" && (
          <div className="py-8 max-w-7xl mx-auto px-4 md:px-8">
            <PublicFaqPage handleNav={handleNav} theme={theme} />
          </div>
        )}

        {/* ==================== 5: CONTACT ROUTE ==================== */}
        {currentPath === "/contact" && (
          <div className="py-8 max-w-7xl mx-auto px-4 md:px-8">
            <PublicContactPage handleNav={handleNav} theme={theme} />
          </div>
        )}

        {/* ==================== 6: DOCUMENTATION & LEGAL ROUTES ==================== */}
        {(currentPath === "/documentation" ||
          currentPath === "/privacy" ||
          currentPath === "/terms") && (
          <div className="py-8 max-w-7xl mx-auto px-4 md:px-8">
            <PublicDocsPage
              handleNav={handleNav}
              theme={theme}
              type={
                currentPath === "/privacy"
                  ? "privacy"
                  : currentPath === "/terms"
                    ? "terms"
                    : "documentation"
              }
            />
          </div>
        )}
      </main>

      {/* Shared Public Footer */}
      <PublicFooter setCurrentPath={setCurrentPath} />
    </div>
  );
}
