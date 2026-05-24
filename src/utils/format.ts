export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  return formatter.format(diffDays, "day");
}
