import sanitizeHtml from "sanitize-html";

/**
 * Article bodies arrive as HTML from another site. They are rendered with
 * dangerouslySetInnerHTML, so nothing reaches the page that is not on this
 * allowlist: the tags the articles actually use, links, and images from the
 * publication's own host. Scripts, styles, iframes and event handlers are
 * dropped, whatever the upstream sends.
 */

export const ARTICLES_ORIGIN = "https://read.repentanceonline.com";

const ALLOWED_TAGS = [
  "p", "strong", "em", "br",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote", "cite",
  "figure", "figcaption", "img",
  "dl", "dt", "dd",
  "table", "caption", "thead", "tbody", "tr", "th", "td",
  "a",
  // Only ever produced here, for a link that has nowhere to go.
  "span",
];

/** An article on the publication, which this site serves at the same path. */
const ARTICLE_LINK = /^https:\/\/read\.repentanceonline\.com(\/articles\/([a-z0-9-]+))(#[\w-]*)?\/?$/i;

/** Root-relative links in a body are relative to the publication, not to us. */
function absolute(href: string): string {
  return href.startsWith("/") && !href.startsWith("//") ? `${ARTICLES_ORIGIN}${href}` : href;
}

export type HeadingAnchor = { id: string; text: string };

/**
 * Cleans an article body and prepares it for this site:
 *
 * - each h2 takes its id from `headings`, in order, so the contents list can
 *   link to it (the upstream HTML carries no ids);
 * - links to other articles become links within this site;
 * - a link to an article that is not in `published` loses the link and keeps
 *   its words: the publication links ahead to articles it has not released,
 *   and those are dead ends there and would be here;
 * - every other link opens the original in a new tab.
 *
 * Without `published`, every article link is kept.
 */
export function prepareArticleHtml(
  html: string,
  headings: HeadingAnchor[] = [],
  published?: ReadonlySet<string>,
): string {
  let heading = 0;

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: [],
      img: ["src", "alt", "loading", "decoding"],
      h2: ["id"],
      th: ["scope", "colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    transformTags: {
      h2: (tagName) => {
        const anchor = headings[heading];
        heading += 1;
        const attribs: Record<string, string> = anchor ? { id: anchor.id } : {};
        return { tagName, attribs };
      },
      a: (tagName, source) => {
        const href = absolute(source.href ?? "");
        const article = href.match(ARTICLE_LINK);
        if (article && published && !published.has(article[2].toLowerCase())) {
          return { tagName: "span", attribs: {} };
        }
        const attribs: Record<string, string> = article
          ? { href: `${article[1]}${article[3] ?? ""}` }
          : { href, target: "_blank", rel: "noopener noreferrer" };
        return { tagName, attribs };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          src: absolute(attribs.src ?? ""),
          alt: attribs.alt ?? "",
          loading: "lazy",
          decoding: "async",
        },
      }),
    },
    // Images only from the publication itself: a body cannot pull a tracking
    // pixel, or anything else, from a third host.
    exclusiveFilter: (frame) =>
      frame.tag === "img" && !(frame.attribs.src ?? "").startsWith(`${ARTICLES_ORIGIN}/`),
  });
}
