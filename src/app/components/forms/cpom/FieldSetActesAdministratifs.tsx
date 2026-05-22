import { DatesAndDocuments } from "./DatesAndDocuments";

export const FieldSetActesAdministratifs = () => {
  return (
    <fieldset className="flex flex-col gap-6">
      <DatesAndDocuments />
      <hr />
    </fieldset>
  );
};
