import { ReactElement } from "react";

import { CalendrierBlock } from "../_calendrier/CalendrierBlock";
import { ControlesBlock } from "../_controles/ControlesBlock";
import { FinancesBlock } from "../_finances/FinancesBlock";
import { ExportActiviteBlock } from "../_pdf-export/ExportActiviteBlock";
import { ExportAdressesBlock } from "../_pdf-export/ExportAdressesBlock";
import { ExportDescriptionBlock } from "../_pdf-export/ExportDescriptionBlock";
import { PdfHeader } from "../_pdf-export/PdfHeader";
import { TypePlaceBlock } from "../_type-places/TypePlaceBlock";

export type StructurePdfExportPayload = {
  exportAddresses: boolean;
  typePlacesFinancesStartYear: number;
  typePlacesFinancesEndYear: number;
  activiteStartMonth: string;
  activiteEndMonth: string;
};

export const StructurePdfExportDocument = ({ data }: Props): ReactElement => {
  return (
    <div className="p-14">
      <PdfHeader />
      <div className="pb-4 break-after-page">
        <ExportDescriptionBlock />
      </div>
      <div className="pt-14">
        <PdfHeader />
      </div>
      <div className="pb-4">
        <CalendrierBlock />
      </div>
      <div className="pb-4 break-after-page">
        <TypePlaceBlock
          startYear={data.typePlacesFinancesStartYear}
          endYear={data.typePlacesFinancesEndYear}
        />
      </div>
      <div className="pt-14">
        <PdfHeader />
      </div>
      <div className="pb-4 break-after-page">
        <FinancesBlock
          startYear={data.typePlacesFinancesStartYear}
          endYear={data.typePlacesFinancesEndYear}
        />
      </div>
      <div className="pt-14">
        <PdfHeader />
      </div>
      <div className="pb-4 break-after-page">
        <ControlesBlock />
      </div>
      <div className="pt-14">
        <PdfHeader />
      </div>
      <div className="pb-4 break-after-page">
        <ExportActiviteBlock
          startDate={data.activiteStartMonth}
          endDate={data.activiteEndMonth}
        />
      </div>
      {data.exportAddresses && (
        <>
          <div className="pt-14">
            <PdfHeader />
          </div>
          <div className="pb-4">
            <ExportAdressesBlock />
          </div>
        </>
      )}
    </div>
  );
};

type Props = {
  data: StructurePdfExportPayload;
};
