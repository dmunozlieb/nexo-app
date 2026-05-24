export function sanitizePlainText(value: string) {
  return value
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim();
}

export function clampText(value: string, maxLength: number) {
  const sanitized = sanitizePlainText(value);
  return sanitized.length > maxLength ? sanitized.slice(0, maxLength) : sanitized;
}
