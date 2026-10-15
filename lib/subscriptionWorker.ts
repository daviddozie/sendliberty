import User from "@/models/User";
import { connectDB } from "./db";
import { syncUserSubscription } from "./paystack/subscription";

const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Sweeps the database for expired Pro subscriptions that have passed their
 * billing period plus the 24-hour grace window, downgrading them and sending
 * notification emails.
 */
export async function runSubscriptionSweep(): Promise<void> {
  try {
    await connectDB();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredUsers = await User.find({
      plan: "pro",
      currentPeriodEnd: { $lt: cutoff },
    });

    for (const user of expiredUsers) {
      await syncUserSubscription(user);
    }
  } catch (err) {
    console.error("Subscription sweep error:", err instanceof Error ? err.message : err);
  }
}

/**
 * Starts a recurring background interval to auto-downgrade expired subscriptions.
 */
export function startSubscriptionWorker(): void {
  // Run first sweep 15 seconds after server boot
  setTimeout(() => {
    void runSubscriptionSweep();
  }, 15000);

  const timer = setInterval(() => {
    void runSubscriptionSweep();
  }, SYNC_INTERVAL_MS);

  timer.unref?.();
}
