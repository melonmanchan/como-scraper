import fetch from "node-fetch";
import mongo from "mongodb";
import redis from "ioredis";
import { JSDOM } from "jsdom";

import { Article } from "../../shared/types";

const client = new redis();

const URL = "mongodb://root:password@localhost:27017";
const DB_NAME = "articleDB";
const ARTICLES_COLLECTION = "articles";

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const mongoClient = await mongo.MongoClient.connect(URL);
  const db = mongoClient.db(DB_NAME);
  const collection = db.collection(ARTICLES_COLLECTION);

  const keys = await client.keys("*");

  const data = await Promise.all(keys.map((k) => client.get(k)));

  const asJson = data.map((str) => {
    const parsed = JSON.parse(str!) as Article;
    return parsed;
  });

  for (let i = 0; i < asJson.length; i++) {
    const article = asJson[i];

    console.log(`downloading article ${i} of ${asJson.length}`);

    const req = await fetch(article.url);
    const text = await req.text();
    const { document } = new JSDOM(text).window;

    const articleContents = [
      ...((document.querySelectorAll(".main-article p") as unknown) as any),
    ];

    await collection.insert({
      ...article,
      contents: articleContents.map((article) => article.innerHTML).join("\n"),
      releasedAt: new Date(article.releasedAt),
    });
  }

  await mongoClient.close();

  process.exit(0);
}

main();
