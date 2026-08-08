/**
 * Centralized Normalization Utilities for VoTex Election System
 * Enforces uniform string normalization for identity fields.
 */

export function normalizeEmail(val?: string): string {
  return String(val || "")
    .trim()
    .toLowerCase();
}

export function normalizeUsername(val?: string): string {
  return String(val || "")
    .trim()
    .toLowerCase();
}

export function normalizePhone(val?: string): string {
  if (!val) return "";
  const cleaned = String(val).trim().replace(/[\s()-]/g, "");
  // Extract digits
  const digits = cleaned.replace(/\D/g, "");
  
  if (digits.startsWith("977") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("9")) {
    return `+977${digits}`;
  }
  if (digits.startsWith("09") && digits.length === 11) {
    return `+977${digits.slice(1)}`;
  }
  
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export function normalizePhoneComparison(val?: string): string {
  const norm = normalizePhone(val);
  if (!norm) return "";
  return norm.replace(/^\+977/, "").replace(/\D/g, "");
}

export function areSamePhone(a?: string, b?: string): boolean {
  const normA = normalizePhoneComparison(a);
  const normB = normalizePhoneComparison(b);
  if (!normA || !normB) return false;
  return normA === normB;
}

export function normalizeNid(val?: string): string {
  return String(val || "")
    .trim()
    .replace(/[\s-]/g, "")
    .toUpperCase();
}

export function normalizeCitizenship(val?: string): string {
  return String(val || "")
    .trim()
    .replace(/[\s-]/g, "")
    .toUpperCase();
}
