import { appBaseUrl, bulletList, paragraph, renderAuthEmail, row } from "./templates";

/** "24 hours", "30 minutes" etc. shown in emails. */
export function formatExpiryLabel(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function buildWelcomeEmailHtml(name: string): string {
  return renderAuthEmail({
    heading: `Welcome to Sendlib${name ? `, ${name}` : ""}!`,
    preheader: "Your account is ready. Start sending transactional emails in minutes.",
    bodyHtml:
      row(
        paragraph(
          `Thanks for signing up. Your account is ready to go: connect a Gmail account and create your first API key to start sending transactional emails.`
        )
      ) +
      row(paragraph(`Next steps:`, { strong: true })) +
      bulletList([
        "1. Connect your Gmail account",
        "2. Create an API key",
        "3. Send your first transactional email",
      ]),
    actionUrl: `${appBaseUrl()}/dashboard`,
    actionLabel: "Go to Dashboard",
    ignoreNote: "If you didn't create a Sendlib account, please ignore this email.",
  });
}

export function buildVerifyEmailHtml(name: string, url: string, expiresInLabel: string): string {
  return renderAuthEmail({
    heading: "Confirm your email address",
    preheader: "Verify your email to secure your Sendlib account.",
    bodyHtml:
      row(paragraph(`Hi ${name},`)) +
      row(
        paragraph(
          `Confirm your email address to activate your Sendlib account and keep it secure. This link expires in ${expiresInLabel}.`
        )
      ),
    actionUrl: url,
    actionLabel: "Verify Email",
    ignoreNote:
      "If you didn't create a Sendlib account, please ignore this email; your account will stay unverified unless you confirm it.",
  });
}

export function buildResendVerificationEmailHtml(
  name: string,
  url: string,
  expiresInLabel: string
): string {
  return renderAuthEmail({
    heading: "Verify your email address",
    preheader: "Here's a fresh verification link for your Sendlib account.",
    bodyHtml:
      row(paragraph(`Hi ${name},`)) +
      row(
        paragraph(
          `You asked for a new verification link. It expires in ${expiresInLabel}. If you've already verified your email, you can ignore this message.`
        )
      ),
    actionUrl: url,
    actionLabel: "Verify Email",
    ignoreNote: "If you didn't request this, you can safely ignore this email.",
  });
}

export function buildPasswordResetEmailHtml(
  name: string,
  url: string,
  expiresInLabel: string
): string {
  return renderAuthEmail({
    heading: "Reset your password",
    preheader: "Use this link to set a new password for your Sendlib account.",
    bodyHtml:
      row(paragraph(`Hi ${name},`)) +
      row(
        paragraph(
          `We received a request to reset your Sendlib password. Click below to choose a new one. This link is single-use and expires in ${expiresInLabel}.`
        )
      ),
    actionUrl: url,
    actionLabel: "Reset Password",
    ignoreNote: "If you didn't request a password reset, you can safely ignore this email.",
  });
}

export function buildPasswordChangedEmailHtml(): string {
  return renderAuthEmail({
    heading: "Your password was changed",
    preheader: "Your Sendlib password has been updated.",
    bodyHtml:
      row(paragraph(`Hi there,`)) +
      row(
        paragraph(
          `Your Sendlib password was just changed. If this was you, no further action is needed. If you didn't make this change, reset your password immediately and contact support.`
        )
      ),
    actionUrl: `${appBaseUrl()}/login`,
    actionLabel: "Go to Login",
    ignoreNote: "If you didn't change your password, please secure your account right away.",
  });
}

export function buildTwoFactorEnabledEmailHtml(): string {
  return renderAuthEmail({
    heading: "Two-factor authentication enabled",
    preheader: "Two-factor authentication is now active on your Sendlib account.",
    bodyHtml:
      row(paragraph(`Hi there,`)) +
      row(
        paragraph(
          `Two-factor authentication (2FA) was just enabled on your Sendlib account. From now on, every login will require a 6-digit code from your authenticator app. Keep your recovery codes safe: they're the only backup way into your account.`
        )
      ),
    ignoreNote: "If you didn't enable 2FA, sign in immediately and turn it off.",
  });
}

export function buildTwoFactorDisabledEmailHtml(): string {
  return renderAuthEmail({
    heading: "Two-factor authentication disabled",
    preheader: "Two-factor authentication is now off for your Sendlib account.",
    bodyHtml:
      row(paragraph(`Hi there,`)) +
      row(
        paragraph(
          `Two-factor authentication (2FA) was just disabled on your Sendlib account. If this was you, no further action is needed. If you didn't disable it, please secure your account immediately.`
        )
      ),
    ignoreNote: "If you didn't disable 2FA, please secure your account right away.",
  });
}

export function buildPaymentFailedDunningEmailHtml(name: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return renderAuthEmail({
    heading: "Action required: Your Pro limits will drop tomorrow",
    preheader: "Your renewal payment could not be processed. Update your card to keep Pro.",
    bodyHtml:
      row(paragraph(greeting)) +
      row(
        paragraph(
          "We were unable to process the renewal payment for your Sendliberty Pro subscription."
        )
      ) +
      row(
        paragraph(
          "Your Pro features remain active under a 24-hour grace window. After that, your account will automatically downgrade to the Free plan:"
        )
      ) +
      bulletList([
        "Daily send limit: Drops from 500 to 200 emails/day",
        "Attachment limit: Drops from 10MB to 1MB per file",
        "Log retention: Drops from 90 days to 5 days",
      ]) +
      row(
        paragraph(
          "If your application sends more than 200 emails per day, your API requests will return 429 Quota Exceeded once the downgrade takes effect."
        )
      ) +
      row(
        paragraph("Update your payment method now to keep your production sending uninterrupted.")
      ),
    actionUrl: `${appBaseUrl()}/dashboard/billing`,
    actionLabel: "Update Payment Method",
    ignoreNote: "If you have already updated your payment details, you can disregard this notice.",
  });
}

export function buildSubscriptionDowngradedEmailHtml(name: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return renderAuthEmail({
    heading: "Your Sendliberty account has been downgraded to Free",
    preheader: "Your Pro subscription has expired and your sending limits are now reduced.",
    bodyHtml:
      row(paragraph(greeting)) +
      row(
        paragraph(
          "Because your renewal payment could not be completed, your Sendliberty subscription has now reverted to the Free plan."
        )
      ) +
      row(
        paragraph(
          "Your account is now subject to Free tier limits: 200 emails per rolling 24 hours and 1MB attachment limits. If any of your API requests are failing with 429 errors today, this limit is why."
        )
      ) +
      row(
        paragraph(
          "You can restore your 500 emails/day Pro tier and unblock your queue at any time:"
        )
      ),
    actionUrl: `${appBaseUrl()}/dashboard/billing`,
    actionLabel: "Restore Pro Access",
    ignoreNote: "If you intentionally canceled your subscription, no further action is needed.",
  });
}
