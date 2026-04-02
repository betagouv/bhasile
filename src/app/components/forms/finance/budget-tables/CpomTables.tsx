import { useFormContext } from "react-hook-form";

import { CpomMillesimeFormValues } from "@/schemas/forms/base/cpom.schema";

import { CpomTable } from "./CpomTable";

export const CpomTables = () => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes") as CpomMillesimeFormValues[];

  const structureTypes = [
    ...new Set(
      cpomMillesimes?.map((cpomMillesime) => cpomMillesime?.type) ?? []
    ),
  ];

  return structureTypes.map((structureType, index) => (
    <>
      <CpomTable
        key={structureType}
        type={structureType}
        showTitle={structureTypes.length > 1}
      />
      {index < structureTypes.length - 1 && <hr className="my-6" />}
    </>
  ));
};
