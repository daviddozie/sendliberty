import { connectToRedis } from "@/lib/redis";

const WINDOW_SIZE = 50;
const MIN_SAMPLE_SIZE = 20;
const MAX_BOUNCE_RATIO = 0.05; // 5%
const PAUSE_DURATION_SECONDS = 15 * 60; // 15 minutes
const ROLLING_KEY_TTL = 3600; // 1 hour

/**
 * Checks if the circuit breaker is currently open (tripped) for a sender.
 */
export async function checkCircuitBreaker(
  senderEmail: string
): Promise<{ open: boolean; remainingSeconds?: number }> {
  if (!process.env.REDIS_URL) return { open: false };

  try {
    const redis = connectToRedis();
    const pauseKey = `circuit_pause:${senderEmail.toLowerCase()}`;
    const ttl = await redis.ttl(pauseKey);

    if (ttl > 0) {
      return { open: true, remainingSeconds: ttl };
    }
    return { open: false };
  } catch (err) {
    console.error("Circuit breaker check failed:", err instanceof Error ? err.message : err);
    return { open: false };
  }
}

/**
 * Records the outcome ("success" or "bounce") of an email attempt for a sender.
 * Evaluates the rolling window and trips the circuit breaker if bounce rate exceeds 5%.
 */
export async function recordDispatchResult(
  senderEmail: string,
  outcome: "success" | "bounce"
): Promise<{ tripped: boolean }> {
  if (!process.env.REDIS_URL) return { tripped: false };

  try {
    const redis = connectToRedis();
    const emailKey = senderEmail.toLowerCase();
    const rollingKey = `circuit_rolling:${emailKey}`;
    const pauseKey = `circuit_pause:${emailKey}`;

    const value = outcome === "bounce" ? "1" : "0";

    const pipeline = redis.pipeline();
    pipeline.lpush(rollingKey, value);
    pipeline.ltrim(rollingKey, 0, WINDOW_SIZE - 1);
    pipeline.expire(rollingKey, ROLLING_KEY_TTL);
    pipeline.lrange(rollingKey, 0, WINDOW_SIZE - 1);

    const results = await pipeline.exec();
    if (!results) return { tripped: false };

    const lrangeResult = results[3];
    if (!lrangeResult || lrangeResult[0]) return { tripped: false };

    const items = (lrangeResult[1] as string[]) || [];
    if (items.length < MIN_SAMPLE_SIZE) {
      return { tripped: false };
    }

    const bounceCount = items.filter((item) => item === "1").length;
    const bounceRatio = bounceCount / items.length;

    if (bounceRatio > MAX_BOUNCE_RATIO) {
      await redis.set(pauseKey, "1", "EX", PAUSE_DURATION_SECONDS);
      return { tripped: true };
    }

    return { tripped: false };
  } catch (err) {
    console.error("Circuit breaker record failed:", err instanceof Error ? err.message : err);
    return { tripped: false };
  }
}
