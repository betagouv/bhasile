export const Repartition = {
  COLLECTIF: "COLLECTIF",
  DIFFUS: "DIFFUS",
  MIXTE: "MIXTE",
} as const;

export type Repartition = (typeof Repartition)[keyof typeof Repartition];

export const RepartitionLabel: Record<Repartition, string> = {
  COLLECTIF: "Collectif",
  DIFFUS: "Diffus",
  MIXTE: "Mixte",
};
