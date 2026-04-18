import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(64, "Maximum 64 characters"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(256, "Too long"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterFormInput = z.infer<typeof RegisterSchema>;
export type RegisterApiInput = RegisterFormInput & { role: "organizer" };
