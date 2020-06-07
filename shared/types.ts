export type Article = {
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

