import Notice from "@codegouvfr/react-dsfr/Notice";
import Link from "next/link";

import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
  wasStructureInCpom,
} from "@/app/utils/structure.util";
import { getFinanceFormTutorialLink } from "@/app/utils/tutorials.util";
import { PLACE_ASILE_CONTACT_EMAIL } from "@/constants";

import { useStructureContext } from "../../../(authenticated)/structures/[id]/_context/StructureClientContext";
import { StructureCpomTable } from "./budget-tables/StructureCpomTable";
import { StructureTable } from "./budget-tables/StructureTable";

export const BudgetTables = () => {
  const { structure } = useStructureContext();
  const { years } = getYearRange({ order: "desc" });
  const wasInCpom = wasStructureInCpom(structure, years);
  const isAutorisee = isStructureAutorisee(structure?.type);
  const isSubventionnee = isStructureSubventionnee(structure?.type);

  return (
    <>
      <Notice
        severity="warning"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
        description={
          <>
            La complétion de cette partie étant complexe, veuillez vous référer{" "}
            <Link
              href={getFinanceFormTutorialLink({
                isAutorisee,
                isSubventionnee,
                wasInCpom,
              })}
              target="_blank"
              className="underline"
            >
              au tutoriel que nous avons créé pour vous guider à cette fin
            </Link>
            .
          </>
        }
      />
      <fieldset className="flex flex-col gap-6 min-w-0 w-full">
        <legend className="text-xl font-bold mb-8 text-title-blue-france">
          Gestion budgétaire de la structure
        </legend>
        <p className="mb-0">
          Veuillez renseigner l’historique du ces données budgétaires{" "}
          <strong>à l’échelle de votre structure.</strong> Concernant les
          affectations, ce tableau reflète le flux annuel et ne constitue en
          aucun cas un calcul ou du stock.
        </p>
        <StructureTable />
      </fieldset>
      {wasInCpom && (
        <fieldset className="flex flex-col gap-6 min-w-0 w-full">
          <legend className="text-xl font-bold mb-8 text-title-blue-france">
            Gestion budgétaire du CPOM
          </legend>
          <Notice
            severity="info"
            title=""
            className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
            description={`L’historique des données budgétaires à l’échelle du CPOM ont déjà été renseignées lors de la saisie du CPOM. Si vous constatez une erreur et voulez apporter une modification, contactez-nous : ${PLACE_ASILE_CONTACT_EMAIL}`}
          />
          <StructureCpomTable canEdit={false} />
        </fieldset>
      )}
    </>
  );
};
