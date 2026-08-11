import { ReactElement } from "react";
import { Control } from "react-hook-form";

import { useAnomalies } from "@/app/components/forms/AnomaliesContext";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { getAnomalieMessage } from "@/app/utils/anomalie.util";

export const TypePlaceCell = ({
  control,
  field,
  year,
  index,
}: Props): ReactElement => {
  const anomalies = useAnomalies({ fields: [field], year });
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
        anomalieMessage={getAnomalieMessage(anomalies)}
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
};
