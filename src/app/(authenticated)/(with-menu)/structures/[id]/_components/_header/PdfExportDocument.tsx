import { ReactElement } from "react";

import { CalendrierBlock } from "../_calendrier/CalendrierBlock";
import { ControlesBlock } from "../_controles/ControlesBlock";
import { FinancesBlock } from "../_finances/FinancesBlock";
import { ExportActiviteBlock } from "../_pdf-export/ExportActiviteBlock";
import { ExportAdressesBlock } from "../_pdf-export/ExportAdressesBlock";
import { ExportDescriptionBlock } from "../_pdf-export/ExportDescriptionBlock";
import { PdfHeader } from "../_pdf-export/PdfHeader";
import { TypePlaceBlock } from "../_type-places/TypePlaceBlock";

export type PdfExportPayload = {
  exportAddresses: boolean;
  typePlacesFinances: {
    startYear: number;
    endYear: number;
  };
  ofii: {
    startMonth: string;
    endMonth: string;
  };
};

export const PdfExportDocument = ({ data }: Props): ReactElement => {
  return (
    <div className="p-8">
      <PdfHeader />
      <div className="pb-4 break-after-page">
        <ExportDescriptionBlock />
      </div>
      <PdfHeader />
      <div className="pb-4">
        <CalendrierBlock />
      </div>
      <div className="pb-4 break-after-page">
        <TypePlaceBlock />
      </div>
      <PdfHeader />
      <div className="pb-4 break-after-page">
        <FinancesBlock />
      </div>
      <PdfHeader />
      <div className="pb-4 break-after-page">
        <ControlesBlock />
      </div>
      <PdfHeader />
      <div className="pb-4">
        <ExportActiviteBlock
          startDate={data.ofii.startMonth}
          endDate={data.ofii.endMonth}
        />
      </div>
      {data.exportAddresses && (
        <>
          <PdfHeader />
          <div className="pb-4">
            <ExportAdressesBlock />
          </div>
        </>
      )}
    </div>
  );
};

type Props = {
  data: PdfExportPayload;
};
