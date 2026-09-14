import { ReactElement } from "react";

import { CalendrierBlock } from "../_calendrier/CalendrierBlock";
import { ControlesBlock } from "../_controles/ControlesBlock";
import { FinancesBlock } from "../_finances/FinancesBlock";
import { ExportActiviteBlock } from "../_pdf-export/ExportActiviteBlock";
import { ExportDescriptionBlock } from "../_pdf-export/ExportDescriptionBlock";
import { PdfHeader } from "../_pdf-export/PdfHeader";
import { TypePlaceBlock } from "../_type-places/TypePlaceBlock";

export type StructurePdfExportPayload = {
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
      <div className="pb-4">
        <ExportActiviteBlock
          startDate={data.activiteStartMonth}
          endDate={data.activiteEndMonth}
        />
      </div>
      <div className="italic">
        Dans les tableaux évaluations, inspections-contrôles et EIG, seuls les
        10 éléments les plus récents sont intégrés dans les exports.
        <br />
        Pour les données mensuelles, seuls les 6 derniers mois sont intégrés
        dans les exports.
        <br />
        Pour les données annuelles, seules les 5 dernières années sont intégrées
        dans les exports.
      </div>
    </div>
  );
};

type Props = {
  data: StructurePdfExportPayload;
};
