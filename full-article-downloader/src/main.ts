import mongo from "mongodb";
import redis from "ioredis";

import { Article } from "../../shared/types";

const client = new redis();

const URL = "mongodb://root:password@localhost:27017";
const DB_NAME = "articleDB";
const ARTICLES_COLLECTION = "articles";

async function main() {
  const mongoClient = await mongo.MongoClient.connect(URL);
  const db = mongoClient.db(DB_NAME);
  const collection = db.collection(ARTICLES_COLLECTION);

  const keys = await client.keys("*");

  const data = await Promise.all(keys.map((k) => client.get(k)));

  const asJson = data.map((str) => {
    const parsed = JSON.parse(str!) as Article;
    return {
      ...parsed,
      releasedAt: new Date(parsed.releasedAt),
    };
  });

  await collection.insertMany(asJson);

  await mongoClient.close();

  process.exit(0);
}

main();
