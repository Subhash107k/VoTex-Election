import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, HelpCircle, RefreshCw } from "lucide-react";

import type { ThemeMode } from "../../types/auth.ts";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  status: string;
}

interface PublicFaqPageProps {
  handleNav: (path: string) => void;
  theme: ThemeMode;
}

export default function PublicFaqPage({
  handleNav,
  theme,
}: PublicFaqPageProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const res = await fetch("/api/faqs");
        if (!res.ok) throw new Error("Unable to load FAQ content");
        const data = await res.json();
        setFaqs(data.faqs || []);
      } catch (error) {
        console.error(error);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const isLight = theme === "light";
  const bgCard = isLight
    ? "bg-white border-slate-200/80 shadow-sm"
    : "bg-slate-950 border-slate-850 shadow-2xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";
  const inputBg = isLight
    ? "bg-slate-100 text-slate-900 border-slate-200"
    : "bg-slate-900 text-white border-slate-800";

  return (
    <section
      className={`min-h-screen px-4 py-14 md:px-8 md:py-20 ${isLight ? "bg-slate-50" : "bg-slate-900"}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <button
          type="button"
          onClick={() => handleNav("/")}
          className={`text-sm font-semibold underline-offset-4 hover:underline ${textMuted}`}
        >
          ← Back to home
        </button>

        <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-8 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-500">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.24em] text-emerald-500">
                Public Help Center
              </p>
              <h1 className={`text-3xl font-black ${textTitle} tracking-tight`}>
                Frequently Asked Questions
              </h1>
            </div>
          </div>
          <p className={`mt-4 max-w-2xl text-sm leading-relaxed ${textMuted}`}>
            Browse official answers about registration, voting steps, privacy,
            and verification.
          </p>
        </div>

        <div className={`rounded-3xl border ${bgCard} p-6 md:p-8`}>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-400">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading FAQs...
            </div>
          ) : faqs.length === 0 ? (
            <div
              className={`rounded-2xl border border-dashed ${inputBg} p-8 text-center text-sm ${textMuted}`}
            >
              No published FAQs are available right now.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={faq.id}
                    className={`overflow-hidden rounded-2xl border ${isLight ? "border-slate-200" : "border-slate-800"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-3 p-5 text-left text-sm font-bold uppercase tracking-wide"
                    >
                      <span className={textTitle}>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-emerald-500" : "text-slate-400"}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-slate-200/70 dark:border-slate-800"
                        >
                          <div
                            className={`p-5 text-sm leading-relaxed ${textMuted}`}
                          >
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className={`rounded-3xl border ${bgCard} p-6 text-sm ${textMuted}`}
        >
          Need more help? Visit the{" "}
          <button
            type="button"
            onClick={() => handleNav("/contact")}
            className="font-semibold text-emerald-500 underline-offset-4 hover:underline"
          >
            contact page
          </button>{" "}
          for official support.
        </div>
      </div>
    </section>
  );
}
