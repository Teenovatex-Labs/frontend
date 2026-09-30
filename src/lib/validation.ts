import { z } from "zod";

// Mirrors backend/src/schemas/auth.ts exactly so client and server agree on the rules.
export const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const emailOnlySchema = z.object({ email: z.string().email("Enter a valid email") });

export const newPasswordSchema = z.object({
  password: strongPassword,
  confirm_password: z.string(),
});

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

// Split out from registerFormSchema so the signup stepper can validate one
// step's fields at a time via `.pick()` — a ZodEffects (the `.refine()`
// result below) can't be picked from.
export const registerBaseSchema = z.object({
  full_name: z.string().min(2, "Enter your full name").max(100),
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  email: z.string().email("Enter a valid email"),
  password: strongPassword,
  confirm_password: z.string(),
});

export const registerFormSchema = registerBaseSchema.refine(
  (data) => data.password === data.confirm_password,
  { message: "Passwords don't match", path: ["confirm_password"] }
);

export function fieldErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string> {
  if (result.success || !result.error) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export const CONTACT_TOPICS = ["hello", "partner", "sponsor", "mentor", "donate", "press", "other"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(100),
  email: z.string().trim().email("Enter a valid email"),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(10, "Say a little more (10 characters minimum)").max(2000),
});
