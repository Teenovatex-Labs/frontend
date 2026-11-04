import { z } from "zod";
import { birthDateSchema } from "@/lib/validation";

// Mirrors backend/src/schemas/admissions.ts startApplicationSchema.
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid WhatsApp number");
const text = (max: number, label: string) => z.string().trim().min(1, `${label} is required`).max(max);

export const startApplicationSchema = z.object({
  full_name: text(120, "Full name"),
  birth_date: birthDateSchema,
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  country: text(80, "Country"),
  city: text(80, "State or city"),
  whatsapp: phone,
  school: z.string().trim().max(160).optional().or(z.literal("")),
  education_level: text(60, "Education level"),
});

export type StartApplicationFields = z.infer<typeof startApplicationSchema>;

export function fieldErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string> {
  if (result.success || !result.error) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
