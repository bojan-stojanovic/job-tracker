import { describe, expect, it } from "vitest";
import { applicationsToCsv, parseCsv } from "@/lib/csv/csv";
import type { Application } from "@/lib/validation/application";

describe("parseCsv", () => {
  it("parses plain rows with LF and CRLF endings", () => {
    expect(parseCsv("a,b\n1,2\r\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("keeps commas inside quoted fields", () => {
    expect(parseCsv('company,role\n"Acme, Inc.",Engineer')).toEqual([
      ["company", "role"],
      ["Acme, Inc.", "Engineer"],
    ]);
  });

  it("unescapes doubled quotes inside quoted fields", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([["a"], ['say "hi"']]);
  });

  it("keeps newlines inside quoted fields", () => {
    expect(parseCsv('a,b\n"line1\nline2",x')).toEqual([
      ["a", "b"],
      ["line1\nline2", "x"],
    ]);
  });

  it("drops blank lines", () => {
    expect(parseCsv("a\n\n\nb")).toEqual([["a"], ["b"]]);
  });
});

describe("applicationsToCsv", () => {
  const base: Application = {
    id: "1",
    userId: "u",
    company: "Acme",
    roleTitle: "Engineer",
    status: "applied",
    position: 1000,
    salaryMin: 70000,
    salaryMax: null,
    currency: "EUR",
    jobUrl: null,
    appliedAt: "2026-10-01",
    createdAt: "",
    updatedAt: "",
  };

  it("writes the header row and leaves status out", () => {
    const csv = applicationsToCsv([base]);
    const [header] = csv.split("\r\n");
    expect(header).toBe(
      "company,roleTitle,salaryMin,salaryMax,currency,jobUrl,appliedAt",
    );
  });

  it("writes empty cells for null values", () => {
    const [, row] = applicationsToCsv([base]).split("\r\n");
    expect(row).toBe("Acme,Engineer,70000,,EUR,,2026-10-01");
  });

  it("quotes fields containing commas and quotes", () => {
    const csv = applicationsToCsv([{ ...base, company: 'Acme, "Labs"' }]);
    const [, row] = csv.split("\r\n");
    expect(row.startsWith('"Acme, ""Labs"""')).toBe(true);
  });

  it("prefixes formula-like values with an apostrophe", () => {
    const csv = applicationsToCsv([{ ...base, company: "=HYPERLINK(\"x\")" }]);
    const [, row] = csv.split("\r\n");
    expect(row.startsWith("\"'=HYPERLINK")).toBe(true);
  });

  it("round-trips through parseCsv", () => {
    const csv = applicationsToCsv([{ ...base, company: "Acme, Inc." }]);
    const parsed = parseCsv(csv);
    expect(parsed[1][0]).toBe("Acme, Inc.");
    expect(parsed[1][2]).toBe("70000");
  });
});