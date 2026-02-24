import { DatesAndDocuments } from "../../cpom/DatesAndDocuments";
import { MaxSizeNotice } from "../../MaxSizeNotice";

export const FieldSetDocuments = () => {
  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Documents
      </legend>
      <MaxSizeNotice />
      <DatesAndDocuments />
      <hr />
    </fieldset>
  );
};
