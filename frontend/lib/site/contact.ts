import type { SiteSections } from "./types";

/**
 * The contact section as links. The Studio stores numbers as people write
 * them ("+254 715 276091"); the links need them as digits.
 */

export type ContactLink = { label: string; href: string };

export interface ContactLinks {
  whatsapp: ContactLink;
  phones: ContactLink[];
  email: ContactLink;
  place: string;
}

const digits = (number: string) => number.replace(/[^\d]/g, "");

export function telHref(number: string): string {
  const trimmed = number.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits(trimmed)}`;
}

/** wa.me takes the international number as bare digits, no plus. */
export function whatsappHref(number: string): string {
  return `https://wa.me/${digits(number)}`;
}

export function contactLinks(contact: SiteSections["contact"]): ContactLinks {
  return {
    whatsapp: { label: contact.whatsapp, href: whatsappHref(contact.whatsapp) },
    phones: [contact.phone_1, contact.phone_2]
      .filter((n): n is string => Boolean(n && n.trim()))
      .map((n) => ({ label: n, href: telHref(n) })),
    email: { label: contact.email, href: `mailto:${contact.email}` },
    place: contact.place,
  };
}
