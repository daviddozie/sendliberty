import Suppression from "@/models/Suppression";
import mongoose from "mongoose";

/**
 * Checks if any email in the provided list is in the user's suppression list.
 * Returns the first suppressed email found, or null if all are clear.
 */
export async function findFirstSuppressedEmail(
  userId: string | mongoose.Types.ObjectId,
  emails: string[]
): Promise<{ email: string; reason: string } | null> {
  if (emails.length === 0) return null;

  const normalized = emails.map((e) => e.trim().toLowerCase());
  const found = await Suppression.findOne({
    userId: typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId,
    email: { $in: normalized },
  })
    .select("email reason")
    .lean();

  if (!found) return null;
  return { email: found.email, reason: found.reason };
}

/**
 * Adds an email address to the user's suppression list (upsert).
 */
export async function addEmailToSuppression(
  userId: string | mongoose.Types.ObjectId,
  email: string,
  reason: "bounce" | "complaint" | "manual" = "bounce",
  detail?: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const userObjectId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  await Suppression.findOneAndUpdate(
    { userId: userObjectId, email: normalized },
    {
      $set: {
        userId: userObjectId,
        email: normalized,
        reason,
        detail,
      },
    },
    { upsert: true }
  );
}
