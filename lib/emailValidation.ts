/**
 * Email validation utility to check recipient address formats
 * and filter known burner / disposable email domains before sending.
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Top high-risk disposable / burner email domains commonly used by bots.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  "10minutemail.com",
  "10minutemail.net",
  "dispostable.com",
  "dropmail.me",
  "getairmail.com",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "inboxkitten.com",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mohmal.com",
  "mytemp.email",
  "nada.ltd",
  "sharklasers.com",
  "spam4.me",
  "spambog.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

export interface EmailValidationResult {
  valid: boolean;
  cleanEmail?: string;
  error?: string;
}

/**
 * Validates a single recipient email address for format and disposable domains.
 */
export function validateRecipientEmail(rawEmail: string): EmailValidationResult {
  if (typeof rawEmail !== "string") {
    return { valid: false, error: "Recipient email must be a string." };
  }

  const trimmed = rawEmail.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: "Recipient email address cannot be empty." };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: "Recipient email address exceeds 254 characters." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: `Invalid email address format: '${rawEmail}'.` };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { valid: false, error: `Invalid email address format: '${rawEmail}'.` };
  }

  const domain = parts[1];
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: `Disposable or temporary email addresses (${domain}) are not accepted.`,
    };
  }

  return { valid: true, cleanEmail: trimmed };
}

/**
 * Validates a list of recipient email addresses.
 */
export function validateRecipientList(
  emails: string[],
  fieldLabel = "recipient"
): { valid: boolean; cleanEmails: string[]; error?: string } {
  const cleanEmails: string[] = [];

  for (const email of emails) {
    const result = validateRecipientEmail(email);
    if (!result.valid) {
      return {
        valid: false,
        cleanEmails: [],
        error: `Invalid ${fieldLabel}: ${result.error}`,
      };
    }
    if (result.cleanEmail) {
      cleanEmails.push(result.cleanEmail);
    }
  }

  return { valid: true, cleanEmails };
}
