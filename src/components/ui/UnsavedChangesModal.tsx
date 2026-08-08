import React from "react";
import { AlertTriangle, X, Save, LogOut } from "lucide-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave?: () => void;
  saving?: boolean;
}

export function UnsavedChangesModal({
  isOpen,
  onStay,
  onDiscard,
  onSave,
  saving = false,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5 text-amber-500">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Unsaved Changes</h3>
          </div>
          <button
            type="button"
            onClick={onStay}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          You have pending modifications to your profile data. If you navigate away now, your edits will be discarded.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onDiscard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Discard Changes
          </button>

          <button
            type="button"
            onClick={onStay}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] text-xs font-bold transition-colors"
          >
            Keep Editing
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save & Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesModal;
