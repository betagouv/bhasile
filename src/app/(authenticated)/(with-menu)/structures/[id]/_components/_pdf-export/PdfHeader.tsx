import { ReactElement } from "react";

import { FermetureBadge } from "@/app/components/structures/FermetureBadge";
import { UpcomingTransformationBadge } from "@/app/components/structures/UpcomingTransformationBadge";
import { useStructureContext } from "@/contexts/StructureContext";

import { HeaderMainContent } from "../_header/HeaderMainContent";

export const PdfHeader = (): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <div className="flex justify-between items-center pb-4">
      <HeaderMainContent />
      {structure.isClosed && structure.fermetureDate && (
        <FermetureBadge fermetureDate={structure.fermetureDate} />
      )}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
          {structure.upcomingTransformations?.map((transformation) => (
            <UpcomingTransformationBadge
              key={`${transformation.kind}-${transformation.date}`}
              transformation={transformation}
            />
          ))}
        </div>
      </div>
      {/* TODO : mettre les vrais numéros de page */}
      <div>1/6</div>
    </div>
  );
};
