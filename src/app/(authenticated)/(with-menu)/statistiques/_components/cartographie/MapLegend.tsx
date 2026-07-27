import { useMemo } from "react";

export const MapLegend = ({ zoneData }: Props) => {
  const { min, max } = useMemo(() => {
    const values = Object.values(zoneData);
    if (values.length === 0) {
      return { min: 0, max: 0 };
    }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [zoneData]);

  return (
    <div className="flex flex-col items-end gap-1 w-32 text-xs text-mention-grey tracking-wider">
      <span className="uppercase font-bold">Légende</span>
      <div className="w-full h-4 bg-linear-to-r from-[#DBDAFF] to-[#00005F]" />
      <div className="flex justify-between w-full px-0.5 mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

type Props = {
  zoneData: Record<string, number>;
};
