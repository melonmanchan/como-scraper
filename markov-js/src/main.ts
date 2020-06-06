import redis from "ioredis";

const client = new redis();

async function main() {
  const data = await client.keys("*");

  console.log(data.length);
}

main();
