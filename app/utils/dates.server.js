export function parseDateTimeLocal(
  value,
  timezoneOffset
) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
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

  if (
    ![year, month, day, hour, minute, offset].every(Number.isFinite) ||
    month < 1 || month > 12 || day < 1 || day > 31 ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) {
    return null;
  }

  const result = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute
    ) +
      offset * 60 * 1000
  );

  return Number.isNaN(result.getTime()) ? null : result;
}
