import { describe, expect, it } from "vitest";

import { newestDistinct, parseChannelFeed } from "../lib/youtube/feed";

const entry = (id: string, title: string, published: string) => `
 <entry>
  <id>yt:video:${id}</id>
  <yt:videoId>${id}</yt:videoId>
  <yt:channelId>UCqdgi-yU4fVlOhKZLrz24rw</yt:channelId>
  <title>${title}</title>
  <link rel="alternate" href="https://www.youtube.com/watch?v=${id}"/>
  <author><name>Repent &amp; Prepare The Way</name></author>
  <published>${published}</published>
  <updated>${published}</updated>
  <media:group><media:title>${title}</media:title></media:group>
 </entry>`;

const feed = (...entries: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom"><title>Repent &amp; Prepare The Way</title>${entries.join("")}</feed>`;

describe("parseChannelFeed", () => {
  it("reads the id, title and date of each entry, and not the channel's own title", () => {
    const videos = parseChannelFeed(
      feed(
        entry("UH3F9rIySCM", "A PROPHECY", "2026-09-24T10:00:00+00:00"),
        entry("d_ylPSQ-YPo", "A SERVICE", "2026-09-23T10:00:00+00:00"),
      ),
    );
    expect(videos).toEqual([
      { id: "UH3F9rIySCM", title: "A PROPHECY", publishedAt: "2026-09-24T10:00:00+00:00" },
      { id: "d_ylPSQ-YPo", title: "A SERVICE", publishedAt: "2026-09-23T10:00:00+00:00" },
    ]);
  });

  it("unescapes titles to plain text", () => {
    const [video] = parseChannelFeed(
      feed(entry("UH3F9rIySCM", "PROPHECY &amp; IT&#39;S FULFILMENT &lt;b&gt;", "2026-09-24T10:00:00+00:00")),
    );
    expect(video.title).toBe("PROPHECY & IT'S FULFILMENT <b>");
  });

  it("drops an entry whose id is not a video id, or that has no date", () => {
    const videos = parseChannelFeed(
      feed(
        entry('x"onload="alert(1)', "BAD ID", "2026-09-24T10:00:00+00:00"),
        entry("UH3F9rIySCM", "NO DATE", "not a date"),
        entry("d_ylPSQ-YPo", "GOOD", "2026-09-23T10:00:00+00:00"),
      ),
    );
    expect(videos.map((video) => video.title)).toEqual(["GOOD"]);
  });

  it("returns nothing for something that is not a feed", () => {
    expect(parseChannelFeed("<html><body>Sign in</body></html>")).toEqual([]);
    expect(parseChannelFeed("")).toEqual([]);
  });
});

describe("newestDistinct", () => {
  const videos = [
    { id: "aaaaaaaaaaa", title: "THE DAY THE LORD DESCENDED", publishedAt: "2026-09-02T10:00:00Z" },
    { id: "bbbbbbbbbbb", title: "A PROPHECY", publishedAt: "2026-09-21T10:00:00Z" },
    { id: "ccccccccccc", title: "The Day  the LORD Descended", publishedAt: "2026-09-06T10:00:00Z" },
    { id: "ddddddddddd", title: "A TEACHING", publishedAt: "2026-09-10T10:00:00Z" },
  ];

  it("orders newest first and keeps one video per title", () => {
    expect(newestDistinct(videos, 6).map((video) => video.id)).toEqual([
      "bbbbbbbbbbb",
      "ddddddddddd",
      "ccccccccccc",
    ]);
  });

  it("stops at the count asked for", () => {
    expect(newestDistinct(videos, 2)).toHaveLength(2);
  });
});
