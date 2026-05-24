export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Ha ocurrido un error inesperado.";
}

export function ensureData<T>(data: T | null, message = "No se encontraron datos.") {
  if (data === null) {
    throw new Error(message);
  }

  return data;
}
