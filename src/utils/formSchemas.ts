import { z } from "zod";

export const emailSchema = z.string().email("Please enter a valid email address.");

export const nameNepaliSchema = z
  .string()
  .min(2, "Name in Nepali is required.")
  .refine(
    (val) => /^[\u0900-\u097F\s.]+$/.test(val.trim()),
    "Must be written in Devanagari script (e.g. थोमस एन्डरसन)"
  );

export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits.")
  .regex(/^[0-9+-\s()]+$/, "Invalid phone number format.");

export const wardSchema = z
  .string()
  .min(1, "Ward number is required.")
  .refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 1 && num <= 99;
  }, "Ward number must be between 1 and 99.");

export const nepalAddressSchema = z.object({
  country: z.string().min(1, "Country is required"),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  municipality: z.string().min(1, "Municipality is required"),
  wardNumber: wardSchema,
  tole: z.string().min(2, "Tole / Street name is required"),
});

export const familyLineageSchema = z.object({
  fatherNameEn: z.string().min(2, "Father's English name is required"),
  fatherNameNp: nameNepaliSchema,
  motherNameEn: z.string().min(2, "Mother's English name is required"),
  motherNameNp: nameNepaliSchema,
  grandfatherNameEn: z.string().min(2, "Grandfather's English name is required"),
  grandfatherNameNp: nameNepaliSchema,
});

export function validateFormSection<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const fieldPath = issue.path.join(".");
    if (fieldPath && !errors[fieldPath]) {
      errors[fieldPath] = issue.message;
    }
  }
  return { success: false, errors };
}
