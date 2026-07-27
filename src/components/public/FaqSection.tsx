import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I create a VoTex voter account?",
      a: "Click 'Create Account', choose your role (Voter or Candidate), fill in your identity information (NID, Citizenship Number, Date of Birth), verify your email and phone via OTP code, and capture your face liveness. Once submitted, your profile is ready for voting.",
    },
    {
      q: "Is my vote completely private and anonymous?",
      a: "Yes. VoTex uses an anonymized cryptographic architecture. Your voter identity is authenticated before opening the ballot, but your ballot selection is recorded independently without attached profile identifiers.",
    },
    {
      q: "Can a voter cast multiple ballots in the same election?",
      a: "No. High-concurrency database constraints and single-vote flags prevent a voter from casting more than one ballot per active election.",
    },
    {
      q: "How does face liveness verification work?",
      a: "During registration and before casting a ballot, the application captures a secure facial snapshot using your device camera. Our computer vision model computes facial embeddings to confirm liveness and match identity.",
    },
    {
      q: "When are official election results made visible to the public?",
      a: "Live results are rendered on the public results portal as soon as election officers publish the election outcome after voting concludes.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-850">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything You Need to Know About VoTex
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors cursor-pointer text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-emerald-500" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-900">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
