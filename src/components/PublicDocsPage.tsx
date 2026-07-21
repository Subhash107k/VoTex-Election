import React from "react";

interface PublicDocsPageProps {
  handleNav: (path: string) => void;
  theme: "light" | "dark";
  type: "documentation" | "privacy" | "terms";
}

export default function PublicDocsPage({
  handleNav,
  theme,
  type,
}: PublicDocsPageProps) {
  const isLight = theme === "light";
  const bgCard = isLight
    ? "bg-white border-slate-200/80 shadow-sm"
    : "bg-slate-950 border-slate-850 shadow-2xl";
  const textTitle = isLight ? "text-slate-900" : "text-white";
  const textMuted = isLight ? "text-slate-500" : "text-slate-400";

  const content = {
    documentation: {
      title: "Documentation",
      subtitle: "Developer and voter guidance for using the VoTex platform.",
      body: [
        "VoTex is a secure digital voting platform designed for voter registration, identity verification, election participation, and result viewing.",
        "The public experience includes account creation, login, election browsing, FAQ support, and contact help. Administrative users can manage elections, candidates, FAQs, and audit logs from the protected dashboard.",
        "This system uses a layered approach for security, privacy, and operational transparency while keeping the experience simple for citizens.",
      ],
    },
    privacy: {
      title: "Privacy Policy",
      subtitle: "How VoTex handles personal data and safeguarding measures.",
      body: [
        "VoTex collects only the information necessary to operate secure voting services, such as account details, profile information, and verification metadata.",
        "Sensitive information is protected through encryption, access control, and audit logging. Personal data is never shared publicly and is only used to support election operations and user support.",
        "Users can request assistance for account issues, verification concerns, or data questions through the support desk.",
      ],
    },
    terms: {
      title: "Terms and Conditions",
      subtitle: "Rules and responsibilities for using the VoTex platform.",
      body: [
        "By using VoTex, users agree to provide accurate information and comply with applicable election rules and platform policies.",
        "Accounts must be used responsibly. Any attempt to bypass verification, manipulate votes, or abuse access controls may result in account restriction or legal action.",
        "VoTex reserves the right to update these terms, improve security controls, and suspend access where required for platform integrity.",
      ],
    },
  };

  const current = content[type];

  return (
    <section
      className={`min-h-screen px-4 py-14 md:px-8 md:py-20 ${isLight ? "bg-slate-50" : "bg-slate-900"}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <button
          type="button"
          onClick={() => handleNav("/")}
          className={`text-sm font-semibold underline-offset-4 hover:underline ${textMuted}`}
        >
          ← Back to home
        </button>

        <div className={`rounded-3xl border ${bgCard} p-8 md:p-10`}>
          <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.24em] text-emerald-500">
            VoTex Public Information
          </p>
          <h1
            className={`mt-3 text-3xl font-black ${textTitle} tracking-tight`}
          >
            {current.title}
          </h1>
          <p className={`mt-3 text-sm leading-relaxed ${textMuted}`}>
            {current.subtitle}
          </p>

          <div
            className={`mt-8 space-y-4 rounded-2xl border border-slate-200/70 p-6 dark:border-slate-800`}
          >
            {current.body.map((paragraph, index) => (
              <p key={index} className={`text-sm leading-relaxed ${textMuted}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
