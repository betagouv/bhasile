import { getTransformationNounAvecArticle } from "@/app/utils/transformation.util";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";
import { FormKind } from "@/types/global";

import { AdresseAdministrativeAndAntennes } from "./AdresseAdministrativeAndAntennes";

type Props = {
  formKind: FormKind;
  originalAntennes: AntenneFormValues[];
};

export const TransformationAdresseAdministrative = ({
  formKind,
  originalAntennes,
}: Props) => {
  const title = `Veuillez saisir l’adresse administrative principale de la structure suite à ${getTransformationNounAvecArticle(
    formKind
  )}.`;

  return (
    <>
      <h2 className="text-xl font-bold mb-4 text-title-blue-france">{title}</h2>
      <AdresseAdministrativeAndAntennes
        formKind={formKind}
        originalAntennes={originalAntennes}
      />
    </>
  );
};
