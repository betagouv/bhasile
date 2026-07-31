import { CartographieEvolutionStat } from "@/schemas/api/statistique-cartographie.schema";

export type EvolutionDirection = CartographieEvolutionStat["direction"];

export type ZoneLabel = {
  code: string;
  value: number;
  x: number;
  y: number;
};

export type ZoneLabelWithTrend = ZoneLabel & {
  delta?: number;
  direction?: EvolutionDirection | null;
};

export type ZoneDataInfo = {
  value: number;
  delta?: number;
  direction?: EvolutionDirection | null;
};
