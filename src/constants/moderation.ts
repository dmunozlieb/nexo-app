export const REPORT_REASONS = [
  "Acoso",
  "Spam",
  "Contenido sexual",
  "Odio o violencia",
  "Suplantacion",
  "Informacion privada",
  "Otro",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
