import redis from "ioredis";
import Markov from "markov-strings";

const client = new redis();

type Article = {
  id: string;
  url: string;
  imageUrl?: string;
  title: string;
  blurb: string;
  releasedAt: string;
  tags: {
    href: string;
    value: string;
  }[];
};

async function main() {
  const keys = await client.keys("*");

  const data = await Promise.all(keys.map((k) => client.get(k)));

  const asJson: Array<Article> = data.map((str) => JSON.parse(str!)) as Array<
    Article
  >;

  const seksi = asJson.filter((data) => {
    return !!data.blurb;
  });

  const titles = seksi.map((data1) => data1!.blurb);
  const markov = new Markov(titles, { stateSize: 2 });

  markov.buildCorpus();

  for (let i = 0; i < 10; i++) {
    const options = {
      maxTries: 20, // Give up if I don't have a sentence after 20 tries (default is 10)
      filter: (result: any) => {
        return (
          (result.string.split(" ").length >= 5 &&
            result.string.endsWith(".")) ||
          result.string.endsWith("!")
        );
      },
    };

    const result = markov.generate(options);
    console.log(result.string);
  }

  process.exit(0);
}

main();
