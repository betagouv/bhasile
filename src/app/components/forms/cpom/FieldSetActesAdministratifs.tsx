import { StructureType } from "@/types/structure.type";

import { DatesAndDocuments } from "./DatesAndDocuments";

export const FieldSetActesAdministratifs = ({ structureTypes }: Props) => {
  return (
    <fieldset className="flex flex-col gap-6">
      <DatesAndDocuments structureTypes={structureTypes} />
      <hr />
    </fieldset>
  );
};

type Props = {
  structureTypes: StructureType[];
};
