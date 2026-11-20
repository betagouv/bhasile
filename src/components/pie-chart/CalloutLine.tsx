import { CalloutLine as CalloutLineGeometry } from "@/utils/pie-chart.util";

export const CalloutLine = ({ line }: Props) => {
  const { anchor, elbow, end } = line;

  return (
    <g data-testid="pie-chart-callout-line">
      <circle cx={anchor.x} cy={anchor.y} r={ANCHOR_RADIUS} fill={LINE_COLOR} />
      <polyline
        points={[anchor, elbow, end].map(({ x, y }) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1}
      />
    </g>
  );
};

const ANCHOR_RADIUS = 2.5;
const LINE_COLOR = "var(--text-default-grey)";

type Props = {
  line: CalloutLineGeometry;
};
