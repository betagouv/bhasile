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

export const REPARTITION_DISPLAY_ORDER: Repartition[] = [
  Repartition.DIFFUS,
  Repartition.COLLECTIF,
  Repartition.MIXTE,
];
