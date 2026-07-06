export function parseDateTimeLocal(
  value,
  timezoneOffset
) {
  if (!value) {
    return null;
  }

  const [
    datePart,
    timePart = "00:00",
  ] = String(value).split("T");

  const [year, month, day] = datePart
    .split("-")
    .map(Number);

  const [hour, minute] = timePart
    .split(":")
    .map(Number);

  const offset = Number(timezoneOffset || 0);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute
    ) +
      offset * 60 * 1000
  );
}
