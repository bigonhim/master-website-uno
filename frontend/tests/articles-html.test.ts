import { describe, expect, it } from "vitest";

import { prepareArticleHtml } from "../lib/articles/html";

/**
 * Article bodies come from another site and are rendered as HTML. These hold
 * the two promises that makes: nothing executable gets through, and what does
 * get through points at the right place.
 */

describe("prepareArticleHtml", () => {
  it("drops scripts, styles, iframes and event handlers", () => {
    const html = prepareArticleHtml(
      '<p onclick="steal()" style="color:red">Text</p>' +
        "<script>alert(1)</script><style>p{}</style>" +
        '<iframe src="https://example.com"></iframe>',
    );
    expect(html).toBe("<p>Text</p>");
  });

  it("refuses javascript: links", () => {
    const html = prepareArticleHtml('<a href="javascript:alert(1)">x</a>');
    expect(html).not.toContain("javascript:");
  });

  it("keeps images from the publication and drops any other host", () => {
    const html = prepareArticleHtml(
      '<img src="https://read.repentanceonline.com/images/articles/a.webp" alt="A road">' +
        '<img src="https://tracker.example/pixel.gif" alt="">' +
        '<img src="https://read.repentanceonline.com.evil.example/a.webp" alt="">',
    );
    expect(html).toContain('src="https://read.repentanceonline.com/images/articles/a.webp"');
    expect(html).toContain('alt="A road"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain("tracker.example");
    expect(html).not.toContain("evil.example");
  });

  it("turns links to other articles into links within this site", () => {
    const html = prepareArticleHtml(
      '<a href="https://read.repentanceonline.com/articles/what-is-repentance-and-holiness">one</a>' +
        '<a href="/articles/what-is-the-rapture-of-the-church#timing">two</a>',
    );
    expect(html).toContain('<a href="/articles/what-is-repentance-and-holiness">one</a>');
    expect(html).toContain('<a href="/articles/what-is-the-rapture-of-the-church#timing">two</a>');
  });

  it("leaves the words and drops the link when the article is not published", () => {
    const published = new Set(["what-is-repentance-and-holiness"]);
    const html = prepareArticleHtml(
      '<p>See <a href="https://read.repentanceonline.com/articles/what-is-repentance-and-holiness">this</a>' +
        ' and <a href="https://read.repentanceonline.com/articles/not-released-yet">that</a>.</p>',
      [],
      published,
    );
    expect(html).toBe(
      '<p>See <a href="/articles/what-is-repentance-and-holiness">this</a> and <span>that</span>.</p>',
    );
  });

  it("opens every other link in a new tab, on the publication when relative", () => {
    const html = prepareArticleHtml(
      '<a href="/altars/mombasa">altar</a><a href="https://www.youtube.com/watch?v=abc">video</a>',
    );
    expect(html).toContain(
      '<a href="https://read.repentanceonline.com/altars/mombasa" target="_blank" rel="noopener noreferrer">',
    );
    expect(html).toContain(
      '<a href="https://www.youtube.com/watch?v=abc" target="_blank" rel="noopener noreferrer">',
    );
  });

  it("gives each h2 its id in order, and none once the list runs out", () => {
    const html = prepareArticleHtml("<h2>First</h2><p>a</p><h2>Second</h2><h2>Third</h2>", [
      { id: "first", text: "First" },
      { id: "second", text: "Second" },
    ]);
    expect(html).toBe(
      '<h2 id="first">First</h2><p>a</p><h2 id="second">Second</h2><h2>Third</h2>',
    );
  });

  it("keeps the markup the articles use", () => {
    const body =
      "<blockquote><p>Follow peace with all men.</p><cite>Hebrews 12:14</cite></blockquote>" +
      "<dl><dt>Term</dt><dd>Meaning</dd></dl>" +
      "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>";
    expect(prepareArticleHtml(body)).toBe(body);
  });
});
