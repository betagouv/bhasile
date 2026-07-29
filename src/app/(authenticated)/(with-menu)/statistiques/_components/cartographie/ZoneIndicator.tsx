import { ReactElement } from "react";

export const ZoneIndicator = ({
  x,
  y,
  value,
  direction,
  delta,
}: Props): ReactElement => {
  const isUp = direction === "hausse" || (delta !== undefined && delta > 0);
  const isDown = direction === "baisse" || (delta !== undefined && delta < 0);
  const isStable =
    direction === "stable" || (delta !== undefined && delta === 0);

  return (
    <div
      className="absolute bg-white rounded-3xl gap-1 flex items-center justify-center p-1 text-xs -translate-1/2 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {value}
      {isUp && (
        <span className="fr-icon-arrow-up-line text-title-blue-france before:w-2 before:h-2 flex" />
      )}
      {isDown && (
        <span className="fr-icon-arrow-down-line text-title-blue-france before:w-2 before:h-2 flex" />
      )}
      {isStable && (
        <span
          className="text-mention-grey font-bold px-0.5 flex items-center"
          style={{ lineHeight: 0 }}
        >
          —
        </span>
      )}
    </div>
  );
};

type Props = {
  x: number;
  y: number;
  value: number;
  direction?: "hausse" | "baisse" | "stable" | string | null;
  delta?: number;
};
