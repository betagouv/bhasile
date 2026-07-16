import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import InputWithValidation from "../../InputWithValidation";

export const Date303 = () => {
  const { control, watch, setValue } = useFormContext();

  const date303 = watch("date303");
  const [display303Date, setDisplay303Date] = useState<boolean>(!!date303);

  // Resynchronise l'affichage quand date303 est (re)renseignée après le montage
  useEffect(() => {
    if (date303) {
      setDisplay303Date(true);
    }
  }, [date303]);

  const handle303DateDisplay = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay303Date(e.target.checked);
    if (!e.target.checked) {
      setValue("date303", null);
    }
  };

  return (
    <div className="mb-6">
      <Checkbox
        options={[
          {
            label:
              "La date de rattachement au programme 303 de cette structure ne correspond pas à sa date de création.",
            nativeInputProps: {
              name: "303",
              checked: display303Date,
              onChange: handle303DateDisplay,
            },
          },
        ]}
      />
      {display303Date && (
        <InputWithValidation
          name="date303"
          control={control}
          label="Date de rattachement au programme 303"
          type="date"
          disabled={!display303Date}
          className="max-w-96 mt-6"
        />
      )}
    </div>
  );
};
