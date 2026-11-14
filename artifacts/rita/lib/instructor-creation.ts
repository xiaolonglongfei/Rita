/** Match the generated name_key: lowercase, strip accents, ASCII letters/digits. */
export function instructorNameKey(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
}

export function studentInstructorValidation(name: unknown, location: unknown) {
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80 ||
    !/^[\p{L}\p{M} .'\u2019-]+$/u.test(name.trim()) || !/\p{L}/u.test(name)) {
    return "Please enter an instructor name of 2–80 characters using letters, spaces, apostrophes, periods or hyphens.";
  }
  if (location != null && (typeof location !== "string" || location.trim().length > 100)) {
    return "Please keep the teaching location to 100 characters or fewer.";
  }
  return null;
}

// Serialize count-and-insert for the same account within this server process.
// Cross-instance atomic enforcement would require a database transaction/RPC.
const pendingCreations = new Map<string, Promise<void>>();
export async function withInstructorCreationLock<T>(userId: string, action: () => Promise<T>): Promise<T> {
  const previous = pendingCreations.get(userId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  pendingCreations.set(userId, current);
  await previous;
  try {
    return await action();
  } finally {
    release();
    if (pendingCreations.get(userId) === current) pendingCreations.delete(userId);
  }
}
