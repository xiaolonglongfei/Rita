export interface GiveawayNameErrors {
  firstName?: string;
  lastName?: string;
}

export function validateGiveawayNames(firstName: unknown, lastName: unknown) {
  const first = typeof firstName === "string" ? firstName.trim() : "";
  const last = typeof lastName === "string" ? lastName.trim() : "";
  const fieldErrors: GiveawayNameErrors = {};
  if (!first) fieldErrors.firstName = "First name is required.";
  else if (first.length > 50) fieldErrors.firstName = "First name must be 50 characters or fewer.";
  if (!last) fieldErrors.lastName = "Last name is required.";
  else if (last.length > 50) fieldErrors.lastName = "Last name must be 50 characters or fewer.";

  return {
    fieldErrors,
    fullName: `${first} ${last}`.replace(/\s+/gu, " "),
    valid: Object.keys(fieldErrors).length === 0,
  };
}

export function isGiveawayEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
