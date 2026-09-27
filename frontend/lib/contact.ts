/**
 * How to reach the ministry. Every detail here is one the ministry publishes
 * itself, on read.repentanceonline.com/about and on its original site; none is
 * invented. There are no office hours or reply times because it publishes
 * none, and a promise the office never made is not ours to make for it.
 */
export const CONTACT = {
  whatsapp: { label: "+254 715 276091", href: "https://wa.me/254715276091" },
  phones: [
    { label: "+254 715 276091", href: "tel:+254715276091" },
    { label: "+254 708 412344", href: "tel:+254708412344" },
  ],
  email: { label: "repentoffice@gmail.com", href: "mailto:repentoffice@gmail.com" },
} as const;

/** Values are the API's; see backend/apps/contact/models.py. */
export const CONTACT_TOPICS = [
  { value: "prayer", label: "Prayer" },
  { value: "visit", label: "Attending a service" },
  { value: "teachings", label: "The teachings" },
  { value: "other", label: "Something else" },
] as const;
