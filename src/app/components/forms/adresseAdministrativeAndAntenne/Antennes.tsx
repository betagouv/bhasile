import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";

import { emptyAntenne, FieldSetAntennes } from "./FieldSetAntennes";

export const Antennes = () => {
  const { watch, setValue } = useFormContext();

  const antennes = (watch("antennes") || []) as AntenneFormValues[];

  const isMultiAntenne = watch("isMultiAntenne");

  const antennesLength = antennes.length;
  useEffect(() => {
    if (isMultiAntenne && antennesLength === 0) {
      setValue("antennes", [emptyAntenne, emptyAntenne]);
    }
    if (!isMultiAntenne) {
      setValue("antennes", []);
    }
  }, [isMultiAntenne, antennesLength, setValue]);

  if (!isMultiAntenne) {
    return null;
  }

  return <FieldSetAntennes />;
};
