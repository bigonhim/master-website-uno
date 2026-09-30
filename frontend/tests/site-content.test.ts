import { describe, expect, it } from "vitest";

import builtin from "../lib/site/builtin-photos.json";
import { contactLinks, telHref, whatsappHref } from "../lib/site/contact";
import defaults from "../lib/site/defaults.json";
import { paragraphs, parseMarkup, plainText } from "../lib/site/markup";

describe("editor markup", () => {
  it("reads **highlight** and *accent* runs", () => {
    expect(parseMarkup("*Follow* peace, and **holiness**.")).toEqual([
      { text: "Follow", style: "em" },
      { text: " peace, and ", style: "plain" },
      { text: "holiness", style: "strong" },
      { text: ".", style: "plain" },
    ]);
  });

  it("leaves text without markup as one run", () => {
    expect(parseMarkup("Prepare the way")).toEqual([{ text: "Prepare the way", style: "plain" }]);
  });

  it("treats a lone star as a character, not markup", () => {
    expect(plainText("5 * 3 = 15")).toBe("5 * 3 = 15");
  });

  it("never lets markup through as HTML", () => {
    const runs = parseMarkup("**<script>alert(1)</script>**");
    expect(runs).toEqual([{ text: "<script>alert(1)</script>", style: "strong" }]);
  });

  it("keeps the non-breaking space in the built-in heading", () => {
    expect(plainText(builtin.recognition.heading)).toBe("The Prophet of THE LORD, honoured");
  });

  it("splits paragraphs on empty lines only", () => {
    expect(paragraphs("One\nstill one.\n\n  Two.  \n\n\n")).toEqual(["One\nstill one.", "Two."]);
  });
});

describe("contact links", () => {
  it("dials the number as digits", () => {
    expect(telHref("+254 715 276091")).toBe("tel:+254715276091");
    expect(telHref("(0715) 276-091")).toBe("tel:0715276091");
  });

  it("opens WhatsApp with the bare international number", () => {
    expect(whatsappHref("+254 715 276091")).toBe("https://wa.me/254715276091");
  });

  it("matches the links the site shipped with before the Studio", () => {
    const links = contactLinks(defaults.contact);
    expect(links.whatsapp.href).toBe("https://wa.me/254715276091");
    expect(links.phones.map((p) => p.href)).toEqual(["tel:+254715276091", "tel:+254708412344"]);
    expect(links.email.href).toBe("mailto:repentoffice@gmail.com");
  });

  it("drops an empty second phone rather than linking nowhere", () => {
    expect(contactLinks({ ...defaults.contact, phone_2: "" }).phones).toHaveLength(1);
  });
});

describe("built-in photos", () => {
  it("still describe every photo the site shipped with", () => {
    expect(builtin.heroSlides).toHaveLength(6);
    expect(builtin.recognition.photos).toHaveLength(5);
    for (const slide of builtin.heroSlides) {
      expect(slide.src).toMatch(/^\/hero\/.+\.webp$/);
      expect(slide.alt.length).toBeGreaterThan(10);
    }
  });
});
