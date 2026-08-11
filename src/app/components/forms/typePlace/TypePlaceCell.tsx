import { ReactElement } from "react";
import { Control } from "react-hook-form";

import { useFieldAnomalies } from "@/app/components/forms/AnomaliesContext";
import InputWithValidation from "@/app/components/forms/InputWithValidation";

export const TypePlaceCell = ({
  control,
  field,
  year,
  index,
  messageId,
}: Props): ReactElement => {
  const anomalies = useFieldAnomalies({ field, year });
  const name = `structureTypologies.${index}.${field}`;

  return (
    <td>
      <InputWithValidation
        name={name}
        id={name}
        control={control}
        type="number"
        min={0}
        label=""
        describedById={anomalies.length > 0 ? messageId : undefined}
        hasAnomalie={anomalies.length > 0}
        className="mb-0 items-center [&_p]:hidden [&_input]:w-full w-24 mx-auto"
        variant="simple"
      />
    </td>
  );
};

type Props = {
  control: Control;
  field: string;
  year: number;
  index: number;
  messageId: string;
};
