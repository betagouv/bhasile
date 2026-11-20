import { alphaNumerate, type PieChartData } from "chartist";

export const PIE_CHART_PADDING = 5;

const MINIMUM_FIRST_SLICE_RATIO = 0.008;
const RIGHT_HALF_END_ANGLE = 180;
const FULL_CIRCLE_ANGLE = 360;
const EDGE_ANCHOR_INSET_ANGLE = 5;
const MINIMUM_HORIZONTAL_SEGMENT = 8;
const CALLOUT_EXIT_MARGIN = 6;
const ELBOW_CLEARANCE_MARGIN = 3;

export const extractSeriesValue = (
  seriesItem: PieChartData["series"][number] | undefined
): number => {
  if (typeof seriesItem === "number") {
    return seriesItem;
  }
  if (
    typeof seriesItem === "object" &&
    seriesItem !== null &&
    "value" in seriesItem &&
    typeof seriesItem.value === "number"
  ) {
    return seriesItem.value;
  }
  return 0;
};

export const applyMinimumFirstSlice = (data: PieChartData): PieChartData => {
  const values = data.series.map(extractSeriesValue);
  const [firstValue, ...remainingValues] = values;
  const remainingSum = remainingValues.reduce((sum, value) => sum + value, 0);

  if (firstValue !== 0 || remainingSum <= 0) {
    return data;
  }

  const minimumValue = remainingSum * MINIMUM_FIRST_SLICE_RATIO;
  const [firstSeriesItem, ...remainingSeries] = data.series;
  const updatedFirstSeriesItem =
    typeof firstSeriesItem === "object" && firstSeriesItem !== null
      ? { ...firstSeriesItem, value: minimumValue }
      : minimumValue;

  return { ...data, series: [updatedFirstSeriesItem, ...remainingSeries] };
};

export const buildSliceColorsCss = ({
  chartClass,
  isDonut,
  colors,
  seriesCount,
}: SliceColorsArgs): string => {
  const sliceClass = isDonut ? "ct-slice-donut" : "ct-slice-pie";
  const colorProperty = isDonut ? "stroke" : "fill";

  return getSeriesColors(colors, seriesCount)
    .map((color, seriesIndex) =>
      color === undefined
        ? null
        : `.${chartClass} .ct-series-${alphaNumerate(seriesIndex)} .${sliceClass} { ${colorProperty}: ${color} !important; }`
    )
    .filter((rule) => rule !== null)
    .join("\n");
};

export const getSeriesColors = (
  colors: string[],
  seriesCount: number
): (string | undefined)[] =>
  Array.from(
    { length: seriesCount },
    (_, seriesIndex) => colors[getSeriesColorIndex(seriesIndex, seriesCount)]
  );

const getSeriesColorIndex = (
  seriesIndex: number,
  seriesCount: number
): number => (seriesCount === 2 && seriesIndex === 1 ? 2 : seriesIndex);

export const computeSlices = (values: number[]): PieSlice[] => {
  const total = values.reduce((sum, value) => sum + value, 0);

  return values.reduce<PieSlice[]>((slices, value) => {
    const startAngle = slices.at(-1)?.endAngle ?? 0;
    const sweepAngle = total > 0 ? (value / total) * FULL_CIRCLE_ANGLE : 0;
    return [
      ...slices,
      { value, startAngle, endAngle: startAngle + sweepAngle },
    ];
  }, []);
};

export const getCalloutAngle = ({ startAngle, endAngle }: PieSlice): number => {
  const rightHalfEndAngle = Math.min(endAngle, RIGHT_HALF_END_ANGLE);
  if (rightHalfEndAngle > startAngle) {
    return (startAngle + rightHalfEndAngle) / 2;
  }

  const edgeInset = Math.min(
    EDGE_ANCHOR_INSET_ANGLE,
    (endAngle - startAngle) / 2
  );
  const distanceToBottom = startAngle - RIGHT_HALF_END_ANGLE;
  const distanceToTop = FULL_CIRCLE_ANGLE - endAngle;
  return distanceToBottom <= distanceToTop
    ? startAngle + edgeInset
    : endAngle - edgeInset;
};

export const polarToCartesian = (
  center: Point,
  radius: number,
  angle: number
): Point => {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(angleInRadians),
    y: center.y + radius * Math.sin(angleInRadians),
  };
};

export const getOuterRadius = (size: number): number =>
  size / 2 - PIE_CHART_PADDING;

export const getAnchorRadius = (size: number, donutWidth?: number): number => {
  const outerRadius = getOuterRadius(size);
  return donutWidth === undefined
    ? outerRadius / 2
    : outerRadius - donutWidth / 2;
};

export const stackLabelTops = ({
  desiredTops,
  heights,
  gap,
}: StackLabelTopsArgs): number[] =>
  desiredTops.reduce<number[]>((tops, desiredTop, index) => {
    if (index === 0) {
      return [desiredTop];
    }
    const previousIndex = index - 1;
    const previousBottom = tops[previousIndex] + (heights[previousIndex] ?? 0);
    return [...tops, Math.max(desiredTop, previousBottom + gap)];
  }, []);

export const getCalloutElbow = ({
  exit,
  lineY,
  labelX,
  center,
  clearanceRadius,
}: CalloutElbowArgs): Point => {
  const circleRightX = getCircleRightX(center, clearanceRadius, lineY);
  const clearedX =
    circleRightX === null ? exit.x : Math.max(exit.x, circleRightX);
  return {
    x: Math.min(clearedX, labelX - MINIMUM_HORIZONTAL_SEGMENT),
    y: lineY,
  };
};

const getCircleRightX = (
  center: Point,
  radius: number,
  y: number
): number | null => {
  const verticalDistance = Math.abs(y - center.y);
  return verticalDistance < radius
    ? center.x + Math.sqrt(radius ** 2 - verticalDistance ** 2)
    : null;
};

export const sortIndexesByValue = (values: number[]): number[] =>
  values
    .map((value, index) => ({ value, index }))
    .sort((first, second) => first.value - second.value)
    .map(({ index }) => index);

export const computeCalloutLayout = ({
  values,
  size,
  donutWidth,
  labelHeights,
  labelX,
  labelGap,
  firstLineCenter,
}: CalloutLayoutArgs): CalloutLayout => {
  const center = { x: size / 2, y: size / 2 };
  const anchorRadius = getAnchorRadius(size, donutWidth);
  const exitRadius = getOuterRadius(size) + CALLOUT_EXIT_MARGIN;

  const callouts = computeSlices(values).map((slice) => {
    const angle = slice.value > 0 ? getCalloutAngle(slice) : slice.startAngle;
    return {
      hasLine: slice.value > 0,
      anchor: polarToCartesian(center, anchorRadius, angle),
      exit: polarToCartesian(center, exitRadius, angle),
    };
  });

  const verticalOrder = sortIndexesByValue(callouts.map(({ exit }) => exit.y));
  const sortedTops = stackLabelTops({
    desiredTops: verticalOrder.map(
      (index) => callouts[index].exit.y - firstLineCenter
    ),
    heights: verticalOrder.map((index) => labelHeights[index] ?? 0),
    gap: labelGap,
  });

  const unshiftedTops: number[] = [];
  verticalOrder.forEach((seriesIndex, rank) => {
    unshiftedTops[seriesIndex] = sortedTops[rank];
  });

  const chartTop = Math.max(0, -Math.min(...unshiftedTops));
  const shift = (point: Point): Point => ({
    x: point.x,
    y: point.y + chartTop,
  });

  const items = callouts.map(({ hasLine, anchor, exit }, index) => {
    const lineY = unshiftedTops[index] + firstLineCenter;
    const elbow = getCalloutElbow({
      exit,
      lineY,
      labelX,
      center,
      clearanceRadius: getOuterRadius(size) + ELBOW_CLEARANCE_MARGIN,
    });
    return {
      top: unshiftedTops[index] + chartTop,
      line: hasLine
        ? {
            anchor: shift(anchor),
            elbow: shift(elbow),
            end: shift({ x: labelX, y: lineY }),
          }
        : null,
    };
  });

  const labelsBottom = Math.max(
    0,
    ...items.map(({ top }, index) => top + (labelHeights[index] ?? 0))
  );

  return {
    items,
    chartTop,
    height: Math.max(chartTop + size, labelsBottom),
  };
};

export type Point = { x: number; y: number };

export type PieSlice = { value: number; startAngle: number; endAngle: number };

export type CalloutLine = { anchor: Point; elbow: Point; end: Point };

export type CalloutLayout = {
  items: { top: number; line: CalloutLine | null }[];
  chartTop: number;
  height: number;
};

type SliceColorsArgs = {
  chartClass: string;
  isDonut: boolean;
  colors: string[];
  seriesCount: number;
};

type StackLabelTopsArgs = {
  desiredTops: number[];
  heights: number[];
  gap: number;
};

type CalloutElbowArgs = {
  exit: Point;
  lineY: number;
  labelX: number;
  center: Point;
  clearanceRadius: number;
};

type CalloutLayoutArgs = {
  values: number[];
  size: number;
  donutWidth?: number;
  labelHeights: number[];
  labelX: number;
  labelGap: number;
  firstLineCenter: number;
};
