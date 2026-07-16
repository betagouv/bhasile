import { useFormContext } from "react-hook-form";

import { CustomNotice } from "../../common/CustomNotice";
import InputWithValidation from "../InputWithValidation";
import UploadWithValidation from "../UploadWithValidation";

export const FieldSetDescription = () => {
  const { control } = useFormContext();

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-4 text-title-blue-france">
        Description
      </legend>
      <CustomNotice
        severity="info"
        description="Formats supportés pour le logo : jpg, png, webp et avif. Taille maximale par fichier : 2 Mo. "
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputWithValidation
          name="name"
          control={control}
          type="text"
          label="Nom de l'opérateur"
          id="name"
        />
        <div className="flex flex-col">
          <label className="mb-2">Logo</label>
          <UploadWithValidation name="logo.key" control={control} />
        </div>
      </div>
    </fieldset>
  );
};
