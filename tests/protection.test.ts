import { validateRecipientEmail, validateRecipientList } from "@/lib/emailValidation";
import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  account: vi.fn(),
  suppressionFindOne: vi.fn(),
  breakerTtl: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ connectDB: vi.fn() }));
vi.mock("@/lib/paystack", () => ({ getEffectiveUserPlan: () => "pro" }));
vi.mock("@/lib/rateLimit", () => ({
  rateLimit: async () => ({ success: true, limit: 100, remaining: 99, resetTimestamp: 0 }),
}));
vi.mock("@/lib/gmail", () => ({
  sendGmailEmail: mocks.send,
  GmailBurstLimitError: class extends Error {},
}));
vi.mock("argon2", () => ({ default: { verify: async () => true } }));
vi.mock("@/models/User", () => ({
  default: { findById: () => ({ lean: async () => ({ plan: "pro", disabled: false }) }) },
}));
vi.mock("@/models/ApiKey", () => ({
  default: {
    find: async () => [
      {
        _id: "507f1f77bcf86cd799439012",
        userId: "507f1f77bcf86cd799439011",
        senderEmail: "test@gmail.com",
        allowedOrigins: [],
        revoked: false,
        keyHash: "hash",
        save: vi.fn(),
      },
    ],
  },
}));
vi.mock("@/models/Suppression", () => ({
  default: {
    findOne: () => ({
      select: () => ({
        lean: mocks.suppressionFindOne,
      }),
    }),
  },
}));
vi.mock("@/lib/redis", () => ({
  connectToRedis: () => ({
    ttl: mocks.breakerTtl,
  }),
}));

const request = (body: unknown) =>
  new NextRequest("https://example.com/api/send", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": "sl_prefix_secret" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.REDIS_URL = "redis://localhost:6379";
  mocks.suppressionFindOne.mockResolvedValue(null);
  mocks.breakerTtl.mockResolvedValue(-2);
  mocks.send.mockResolvedValue({ messageId: "msg_123" });
});

it("validates valid and invalid email addresses accurately", () => {
  expect(validateRecipientEmail("valid.user@company.com").valid).toBe(true);
  expect(validateRecipientEmail("not-an-email").valid).toBe(false);
  expect(validateRecipientEmail("user@mailinator.com").valid).toBe(false);
  expect(validateRecipientEmail("user@tempmail.com").valid).toBe(false);

  const listRes = validateRecipientList(["a@b.com", "c@trashmail.com"]);
  expect(listRes.valid).toBe(false);
  expect(listRes.error).toContain("trashmail.com");
});

it("rejects send requests targeting disposable domains with 400", async () => {
  const { POST } = await import("@/app/api/send/route");
  const response = await POST(
    request({
      to: "bot@mailinator.com",
      subject: "Test",
      text: "Hello",
      from: "test@gmail.com",
    })
  );
  expect(response.status).toBe(400);
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.message).toContain("Disposable or temporary email addresses");
  expect(mocks.send).not.toHaveBeenCalled();
});

it("rejects send requests targeting suppressed recipients with 422", async () => {
  mocks.suppressionFindOne.mockResolvedValueOnce({
    email: "bounced@example.com",
    reason: "bounce",
  });
  const { POST } = await import("@/app/api/send/route");
  const response = await POST(
    request({
      to: "bounced@example.com",
      subject: "Test",
      text: "Hello",
      from: "test@gmail.com",
    })
  );
  expect(response.status).toBe(422);
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.message).toContain("suppressed due to a previous bounce");
  expect(mocks.send).not.toHaveBeenCalled();
});

it("blocks send requests with 429 when circuit breaker is tripped", async () => {
  mocks.breakerTtl.mockResolvedValueOnce(450); // 450 seconds remaining
  const { POST } = await import("@/app/api/send/route");
  const response = await POST(
    request({
      to: "customer@example.com",
      subject: "Test",
      text: "Hello",
      from: "test@gmail.com",
    })
  );
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("450");
  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.message).toContain("elevated bounce rate");
  expect(mocks.send).not.toHaveBeenCalled();
});
