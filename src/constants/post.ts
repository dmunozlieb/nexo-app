import type { PostType } from "../types/domain";

export const POST_TYPES: Array<{
  value: PostType;
  label: string;
  description: string;
  color: string;
}> = [
  {
    value: "debate",
    label: "Debate",
    description: "Una pregunta para contrastar puntos de vista.",
    color: "#7C5CFF",
  },
  {
    value: "help",
    label: "Ayuda",
    description: "Pide guia, recursos o acompanamiento.",
    color: "#00D4FF",
  },
  {
    value: "fanart",
    label: "Fanart",
    description: "Comparte arte, edits, cosplay o creaciones.",
    color: "#FF4FD8",
  },
  {
    value: "poll",
    label: "Encuesta",
    description: "Toma el pulso a la Orbita.",
    color: "#FFB020",
  },
  {
    value: "story",
    label: "Historia",
    description: "Cuenta una experiencia o relato.",
    color: "#37E29F",
  },
  {
    value: "recommendation",
    label: "Recomendacion",
    description: "Sugiere contenido, herramientas o planes.",
    color: "#9B8CFF",
  },
  {
    value: "event",
    label: "Evento",
    description: "Organiza una cita o actividad de comunidad.",
    color: "#FF7A59",
  },
];
