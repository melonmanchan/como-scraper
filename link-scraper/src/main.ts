import fetch from "node-fetch";
import redis from "ioredis";
import { JSDOM } from "jsdom";

const client = new redis(process.env.REDIS_URL || undefined);

process.on("unhandledRejection", (e) => {
  console.error(e); // eslint-disable-line
  throw new Error("Unhandled exception");
});

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const MAX_PAGE = 1863;
  const URL = "https://www.como.fi/uutiset/page/";

  for (let i = 0; i < MAX_PAGE; i++) {
    console.log(`Processing page ${i} of ${MAX_PAGE} `);
    const req = await fetch(URL + i);
    const text = await req.text();

    const { document } = new JSDOM(text).window;

    const posts = [
      ...((document.querySelectorAll(".aiheet-seksi") as unknown) as Array<
        Element
      >),
    ];

    const formatted = posts.map((p) => {
      const id = p.getAttribute("id");
      const imageUrl = p
        .querySelector(".wp-post-image")
        ?.getAttribute("data-src");
      const url = p.querySelector("a")?.href;
      const title = p.querySelector(".entry-title > a")?.innerHTML;
      const blurb = p.querySelector(".entry-content > p")?.innerHTML;
      const releasedAt = p.querySelector("time")?.getAttribute("datetime");

      const tagsRaw = [
        ...((p.querySelectorAll(".entry-meta strong a") as unknown) as Array<
          Element
        >),
      ];

      const tags = tagsRaw.map((tag) => {
        return {
          href: tag.getAttribute("href"),
          value: tag.innerHTML,
        };
      });

      return {
        id,
        url,
        imageUrl,
        title,
        blurb,
        releasedAt,
        tags,
      };
    });

    console.log(`${formatted.length} posts`);

    for (const post of formatted) {
      if (await client.exists(post.id!)) {
        console.log(`${post.id} saved`);
      } else {
        console.log(`${post.id} not saved`);
        await client.set(post.id!, JSON.stringify(post));
      }
    }

    await timeout(1000);
  }

  process.exit(0);
}

main();
