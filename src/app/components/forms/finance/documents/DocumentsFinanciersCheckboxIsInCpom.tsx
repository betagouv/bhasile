import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

import { useFormContext } from "@/app/context/FormContext";

export const DocumentsFinanciersCheckboxIsInCpom = ({ year, index }: Props) => {
  const { register } = useFormContext();

  return (
    <Checkbox
      options={[
        {
          label: `En ${year}, cette structure faisait partie d'un CPOM et était prise en compte dans les résultats financiers de celui-ci`,
          nativeInputProps: register(`structureMillesimes.${index}.cpom`),
        },
      ]}
      className="mb-6"
    />
  );
};

type Props = {
  year: number;
  index: number;
};
