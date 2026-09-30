import { describe, expect, it } from "vitest";

import { can, qs } from "../lib/studio/client";
import { fieldLabel, fromLocalInput, studioHref, toLocalInput } from "../lib/studio/format";
import { TOKEN_SHAPE, isSameOrigin, readBody } from "../lib/studio/session";

const request = (headers: Record<string, string>) =>
  new Request("http://internal:3000/api/studio/items", { method: "POST", headers });

describe("same-origin check on Studio writes", () => {
  it("accepts a request from the site's own pages", () => {
    expect(isSameOrigin(request({ origin: "https://example.org", host: "example.org" }))).toBe(true);
  });

  it("uses the host the browser addressed, behind a proxy", () => {
    expect(
      isSameOrigin(
        request({ origin: "https://example.org", host: "internal:3000", "x-forwarded-host": "example.org" }),
      ),
    ).toBe(true);
  });

  it("refuses another site, a missing origin and a lookalike host", () => {
    expect(isSameOrigin(request({ origin: "https://evil.example", host: "example.org" }))).toBe(false);
    expect(isSameOrigin(request({ host: "example.org" }))).toBe(false);
    expect(isSameOrigin(request({ origin: "https://example.org.evil.example", host: "example.org" }))).toBe(false);
    expect(isSameOrigin(request({ origin: "null", host: "example.org" }))).toBe(false);
  });
});

describe("Nairobi time in date inputs", () => {
  it("shows a UTC timestamp as Nairobi wall time", () => {
    expect(toLocalInput("2026-10-01T06:30:00Z")).toBe("2026-10-01T09:30");
  });

  it("reads a typed time as Nairobi time", () => {
    expect(fromLocalInput("2026-10-01T09:30")).toBe("2026-10-01T06:30:00.000Z");
  });

  it("round-trips", () => {
    const value = "2026-12-24T21:00:00.000Z";
    expect(fromLocalInput(toLocalInput(value))).toBe(value);
  });

  it("treats empty as no date", () => {
    expect(toLocalInput(null)).toBe("");
    expect(fromLocalInput("")).toBeNull();
  });
});

describe("helpers", () => {
  it("builds query strings without empty values", () => {
    expect(qs({ q: "", kind: "prophecy", unused: true, missing_alt: false, limit: 25 })).toBe(
      "?kind=prophecy&unused=1&limit=25",
    );
    expect(qs({})).toBe("");
  });

  it("checks permissions, with superusers allowed everything", () => {
    expect(can({ is_superuser: false, permissions: ["media.view_mediaasset"] }, "media.view_mediaasset")).toBe(true);
    expect(can({ is_superuser: false, permissions: [] }, "media.view_mediaasset")).toBe(false);
    expect(can({ is_superuser: true, permissions: [] }, "anything")).toBe(true);
  });

  it("labels fields and links history to the right editor", () => {
    expect(fieldLabel("fulfillment_summary")).toBe("Fulfillment summary");
    expect(studioHref("content.contentitem", 7)).toBe("/studio/archive/7");
    expect(studioHref("sitecontent.sitesection", "contact")).toBe("/studio/text/contact");
    expect(studioHref("unknown.model", 1)).toBeNull();
  });
});

describe("request bodies through the relay", () => {
  const post = (body: string, headers: Record<string, string> = {}) =>
    new Request("http://x/api/studio/items", { method: "POST", body, headers });

  it("reads a body within the limit", async () => {
    const body = await readBody(post("hello"), 10);
    expect(new TextDecoder().decode(body!)).toBe("hello");
  });

  it("refuses a body declared larger than the limit without reading it", async () => {
    expect(await readBody(post("hi", { "content-length": "999999" }), 10)).toBeNull();
  });

  it("cuts off a body that runs past the limit, whatever it declared", async () => {
    expect(await readBody(post("x".repeat(50)), 10)).toBeNull();
  });

  it("only accepts cookies shaped like a real token", () => {
    expect(TOKEN_SHAPE.test("a".repeat(43))).toBe(true);
    expect(TOKEN_SHAPE.test("bogus")).toBe(false);
    expect(TOKEN_SHAPE.test("a".repeat(42) + "/")).toBe(false);
  });
});
