import { FormKind } from "@/types/global";

import { MaxSizeNotice } from "../MaxSizeNotice";
import { DatesAndDocuments } from "./DatesAndDocuments";

export const FieldSetActesAdministratifs = ({ formKind }: Props) => {
  return (
    <fieldset className="flex flex-col gap-6">
      {formKind !== "modification" && (
        <legend className="text-xl font-bold mb-4 text-title-blue-france">
          Actes administratifs
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
