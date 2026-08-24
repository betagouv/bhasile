import { ReactElement } from "react";

import { PdfHeader } from "../_pdf-export/PdfHeader";
import { Structure } from "../Structure";

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
  console.log(">>>>>", data);
  return (
    <div className="p-8">
      <PdfHeader />
      <Structure />
    </div>
  );
};

type Props = {
  data: PdfExportPayload;
};
