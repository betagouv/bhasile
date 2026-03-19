"use client";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";

export const StructureName = ({ id }: Props) => {
  const { currentValue } = useLocalStorage(
    `ajout-structure-${id}-identification`,
    {} as Partial<AjoutIdentificationFormValues>
  );

  return (
    <>
      {currentValue?.nom ? <strong>{currentValue.nom} - </strong> : ""}
      {currentValue?.codeBhasile}
    </>
  );
};

type Props = { id: string | string[] };
