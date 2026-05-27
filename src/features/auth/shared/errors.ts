import { getErrorMessage } from "../../../utils/errors";

type ErrorMapper = (lowerMessage: string) => string | null;

const commonMappers: ErrorMapper[] = [
  (message) =>
    message.includes("rate limit")
      ? "Demasiados intentos seguidos. Espera un poco y vuelve a intentarlo."
      : null,
  (message) =>
    message.includes("network") || message.includes("fetch")
      ? "No pudimos conectar con Nexo. Comprueba tu conexion e intenta otra vez."
      : null,
];

function mapAuthError(
  error: unknown,
  fallback: string,
  specificMappers: ErrorMapper[] = [],
) {
  const message = getErrorMessage(error).toLowerCase();
  const mappers = [...specificMappers, ...commonMappers];

  for (const mapper of mappers) {
    const result = mapper(message);
    if (result) {
      return result;
    }
  }

  return fallback;
}

export function getFriendlyLoginError(error: unknown) {
  return mapAuthError(error, "No se pudo iniciar sesion. Revisa los datos e intentalo de nuevo.", [
    (message) =>
      message.includes("invalid login") ||
      message.includes("invalid credentials") ||
      message.includes("credentials")
        ? "No encontramos esa senal. Revisa tu email o contrasena e intentalo de nuevo."
        : null,
  ]);
}

export function getFriendlyRegisterError(error: unknown) {
  return mapAuthError(error, "No se pudo crear la cuenta. Revisa los datos e intentalo de nuevo.", [
    (message) =>
      message.includes("already") || message.includes("registered")
        ? "Ese email ya orbita con nosotros. Prueba a iniciar sesion."
        : null,
  ]);
}

export function getFriendlyResetError(error: unknown) {
  return mapAuthError(
    error,
    "No pudimos enviar el enlace. Revisa el email e intentalo de nuevo.",
    [
      (message) =>
        message.includes("rate limit")
          ? "Demasiados emails seguidos. Espera un poco y vuelve a intentarlo."
          : null,
    ],
  );
}
