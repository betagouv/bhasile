import { FormKind } from "@/types/global";

import { DatesAndDocuments } from "../../cpom/DatesAndDocuments";
import { MaxSizeNotice } from "../../MaxSizeNotice";

export const FieldSetDocuments = ({ formKind }: Props) => {
  return (
    <fieldset className="flex flex-col gap-6">
      {formKind !== "modification" && (
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          Documents
        </legend>
      )}
      <MaxSizeNotice />
      <DatesAndDocuments />
      <hr />
    </fieldset>
  );
};

type Props = {
  formKind?: FormKind;
};
