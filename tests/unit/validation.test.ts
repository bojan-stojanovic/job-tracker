import { describe, expect, it } from "vitest";
import { applicationInputSchema } from "@/lib/validation/application";
import { contactInputSchema } from "@/lib/validation/contact";

const validApp = {
  company: "Acme",
  roleTitle: "Engineer",
  salaryMin: 70000,
  salaryMax: 85000,
  currency: "EUR",
  jobUrl: null,
  appliedAt: "2026-10-01",
};

describe("applicationInputSchema", () => {
  it("accepts a valid application", () => {
    expect(applicationInputSchema.safeParse(validApp).success).toBe(true);
  });

  it("rejects a salary maximum below the minimum", () => {
    const result = applicationInputSchema.safeParse({
      ...validApp,
      salaryMin: 90000,
      salaryMax: 80000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["salaryMax"]);
    }
  });

  it("allows a missing salary on either side", () => {
    expect(
      applicationInputSchema.safeParse({ ...validApp, salaryMin: null }).success,
    ).toBe(true);
  });

  it("rejects an empty company after trimming", () => {
    expect(
      applicationInputSchema.safeParse({ ...validApp, company: "   " }).success,
    ).toBe(false);
  });

  it("uppercases the currency code", () => {
    const result = applicationInputSchema.safeParse({ ...validApp, currency: "eur" });
    expect(result.success && result.data.currency).toBe("EUR");
  });

  it("rejects an invalid applied date", () => {
    expect(
      applicationInputSchema.safeParse({ ...validApp, appliedAt: "2026-13-40" })
        .success,
    ).toBe(false);
  });
});

describe("contactInputSchema", () => {
  it("treats an empty email as not provided", () => {
    const result = contactInputSchema.safeParse({ name: "Maria", email: "", title: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
      expect(result.data.title).toBeUndefined();
    }
  });

  it("rejects a malformed email", () => {
    expect(
      contactInputSchema.safeParse({ name: "Maria", email: "not-an-email" }).success,
    ).toBe(false);
  });
});