import { ReactElement } from "react";

import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { cn } from "@/app/utils/classname.util";
import { getPercentage } from "@/app/utils/common.util";
import { useExportContext } from "@/contexts/ExportContext";

export const PlacesWithPercentage = ({
  value,
  placesAutorisees,
}: Props): ReactElement => {
  const isExporting = useExportContext();
  const hasPlacesAutorisees = !!placesAutorisees && placesAutorisees > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center",
        isExporting ? "gap-2" : "gap-6"
      )}
    >
      <NumberDisplay value={value} />
      {hasPlacesAutorisees && (
        <span className="text-mention-grey">
          {getPercentage(value, placesAutorisees)}
        </span>
      )}
    </span>
  );
};

type Props = {
  value: number;
  placesAutorisees: number | null | undefined;
};
