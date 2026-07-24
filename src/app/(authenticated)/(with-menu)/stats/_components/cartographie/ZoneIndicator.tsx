import { ReactElement } from "react";

export const ZoneIndicator = ({ x, y, value }: Props): ReactElement => {
  return (
    <div
      className="absolute bg-white rounded-3xl gap-1 flex items-center py-1 px-2.5 text-xs font-bold -translate-1/2 pointer-events-none border-[#e0e0e0]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      {value}
      {/* TODO: Changer la direction de la flèche en fonction de la progression */}
      <span className="fr-icon-arrow-up-line text-title-blue-france" />
    </div>
  );
};

type Props = {
  x: number;
  y: number;
  value: number;
};
