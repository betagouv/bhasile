import { CpomActeScope } from "@/app/utils/cpom.util";

import { DatesAndDocuments } from "./DatesAndDocuments";

export const FieldSetActesAdministratifs = ({ currentScope }: Props) => {
  return (
    <fieldset className="flex flex-col gap-6">
      <DatesAndDocuments currentScope={currentScope} />
      <hr />
    </fieldset>
  );
};

type Props = {
  currentScope?: CpomActeScope;
};
