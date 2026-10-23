/** Use browser-local calendar fields, never UTC or a fixed timezone offset. */
export function getLocalSessionDefaults(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    // Floor the wall-clock minutes: rounding to nearest can select a future time.
    time: `${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / 5) * 5)}`,
  };
}
