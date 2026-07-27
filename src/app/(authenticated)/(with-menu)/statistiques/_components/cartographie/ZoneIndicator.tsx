import { ReactElement } from "react";

export const ZoneIndicator = ({ x, y, value }: Props): ReactElement => {
  return (
    <div
      className="absolute bg-white rounded-3xl gap-1 flex items-center justify-center p-1 text-xs -translate-1/2 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {value}
      {/* TODO: Changer la direction de la flèche en fonction de la progression */}
      <span className="fr-icon-arrow-up-line text-title-blue-france before:w-2 before:h-2 flex" />
    </div>
  );
};

type Props = {
  x: number;
  y: number;
  value: number;
};
