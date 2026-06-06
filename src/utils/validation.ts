import { z } from "zod";
import { REPORT_REASONS } from "../constants/moderation";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El username necesita al menos 3 caracteres.")
  .max(24, "El username no puede superar 24 caracteres.")
  .regex(/^[a-z0-9_]+$/, "Usa solo letras minusculas, numeros y guion bajo.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre visible necesita al menos 2 caracteres.")
  .max(40, "El nombre visible no puede superar 40 caracteres.");

export const authLoginSchema = z.object({
  email: z.string().trim().email("Introduce un email valido."),
  password: z.string().min(8, "La contrasena necesita al menos 8 caracteres."),
});

export const authRegisterSchema = z
  .object({
    email: z.string().trim().email("Introduce un email valido."),
    password: z
      .string()
      .min(8, "La contrasena necesita al menos 8 caracteres.")
      .regex(/[A-Z]/, "Incluye al menos una mayuscula.")
      .regex(/[a-z]/, "Incluye al menos una minuscula.")
      .regex(/[0-9]/, "Incluye al menos un numero."),
    confirmPassword: z.string().min(1, "Confirma tu contrasena."),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden.",
  });

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Introduce un email valido."),
});

export const onboardingSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: z
    .string()
    .trim()
    .max(160, "La bio no puede superar 160 caracteres.")
    .optional(),
  interestIds: z.array(z.string().uuid()).min(1, "Elige al menos un interes."),
  avatarUrl: z.string().url().optional().nullable(),
});

export const accentColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Usa un color hex valido (#RRGGBB).");

const profileLinkSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "La etiqueta no puede estar vacia.")
    .max(40, "La etiqueta no puede superar 40 caracteres."),
  url: z
    .string()
    .trim()
    .max(200, "El enlace no puede superar 200 caracteres.")
    .url("Introduce un enlace valido.")
    .refine((value) => value.startsWith("https://"), "Solo se permiten enlaces https seguros."),
});

export const linksSchema = z
  .array(profileLinkSchema)
  .max(5, "Maximo 5 enlaces.");

export const profileSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  // El edit perfil permite una bio larga (2000). El onboarding mantiene 160 a proposito.
  bio: z
    .string()
    .trim()
    .max(2000, "La bio no puede superar 2000 caracteres.")
    .nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  accentColor: accentColorSchema.nullable().optional(),
  links: linksSchema.optional(),
});

export const postFormSchema = z.object({
  communityId: z.string().uuid("Elige una Orbita valida."),
  type: z.enum([
    "debate",
    "help",
    "fanart",
    "poll",
    "story",
    "recommendation",
    "event",
  ]),
  title: z
    .string()
    .trim()
    .max(120, "El titulo no puede superar 120 caracteres.")
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, "Escribe algo para publicar.")
    .max(5000, "La publicacion no puede superar 5000 caracteres."),
  mediaUrls: z.array(z.string().url()).max(6),
});

export const createCommunitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre necesita al menos 2 caracteres.")
    .max(80, "El nombre no puede superar 80 caracteres."),
  category: z
    .string()
    .trim()
    .min(2, "Elige un tema o categoria.")
    .max(40, "La categoria no puede superar 40 caracteres."),
  description: z
    .string()
    .trim()
    .min(12, "Describe la Orbita con un poco mas de contexto.")
    .max(600, "La descripcion no puede superar 600 caracteres."),
  rulesText: z
    .string()
    .trim()
    .max(1200, "Las normas no pueden superar 1200 caracteres.")
    .optional(),
  visibility: z.enum(["public", "private", "unlisted"]),
  avatarUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
});

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escribe un comentario.")
    .max(1000, "El comentario no puede superar 1000 caracteres."),
  parentId: z.string().uuid().nullable().optional(),
});

export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje.")
    .max(1000, "El mensaje no puede superar 1000 caracteres."),
});

export const reportSchema = z.object({
  targetType: z.enum(["post", "comment", "message", "profile", "community"]),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});

export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileLinkInput = z.infer<typeof profileLinkSchema>;
export type PostFormInput = z.infer<typeof postFormSchema>;
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
