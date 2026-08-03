import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputBg: string;
  autoComplete?: string;
  placeholder?: string;
  rightAction?: React.ReactNode;
}

export default function PasswordField({
  label,
  value,
  onChange,
  inputBg,
  autoComplete = "current-password",
  placeholder = "Enter password",
  rightAction,
}: PasswordFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {rightAction}
      </div>
      <div className="relative">
        <input
          type={isPasswordVisible ? "text" : "password"}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border px-3 py-2.5 pr-10 text-xs sm:text-sm ${inputBg}`}
        />
        <button
          type="button"
          onClick={() => setIsPasswordVisible((current) => !current)}
          className="absolute right-2 top-1.5 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          title={isPasswordVisible ? "Hide password" : "Show password"}
        >
          {isPasswordVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
