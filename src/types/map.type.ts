export type ZoneLabel = {
  code: string;
  value: number;
  x: number;
  y: number;
};

export type ZoneLabelWithTrend = ZoneLabel & {
  delta?: number;
  direction?: string | null;
};

export type ZoneDataInfo = {
  value: number;
  delta?: number;
  direction?: string | null;
};
