import zxcvbn from "zxcvbn";

interface PasswordStrengthProps {
  password: string;
}

const labels = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];
const barColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-emerald-500",
];
const textColors = [
  "text-red-400",
  "text-orange-400",
  "text-yellow-400",
  "text-blue-400",
  "text-emerald-400",
];

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const evaluation = zxcvbn(password);
  const score = evaluation.score;

  return (
    <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-left text-[10px] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between font-semibold">
        <span className="text-slate-500">Password strength</span>
        <span className={`${textColors[score]} font-bold`}>
          {labels[score]}
        </span>
      </div>

      <div className="mt-1 flex h-1.5 gap-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              index <= score ? barColors[score] : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        ))}
      </div>

      {(evaluation.feedback.warning ||
        evaluation.feedback.suggestions?.length > 0) && (
        <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 leading-relaxed text-slate-500 dark:border-slate-800">
          {evaluation.feedback.warning && (
            <p className="font-semibold text-amber-500">
              Warning: {evaluation.feedback.warning}
            </p>
          )}
          {evaluation.feedback.suggestions?.map((suggestion, index) => (
            <p key={index}>{suggestion}</p>
          ))}
        </div>
      )}
    </div>
  );
}
