import Link from "next/link";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { getFinanceFormTutorialLink } from "@/app/utils/tutorials.util";
import { BHASILE_CONTACT_EMAIL } from "@/constants";

import { useStructureContext } from "../../../(authenticated)/structures/[id]/_context/StructureClientContext";
import { CustomNotice } from "../../common/CustomNotice";
import { StructureCpomTable } from "./budget-tables/StructureCpomTable";
import { StructureTable } from "./budget-tables/StructureTable";

export const BudgetTables = () => {
  const { structure } = useStructureContext();
  const isAutorisee = isStructureAutorisee(structure?.type);
  const isSubventionnee = isStructureSubventionnee(structure?.type);
  const wasInCpom = structure.isInCpomPerYear.some(
    (year) => Object.values(year)[0] === true
  );
  return (
    <>
      <CustomNotice
        severity="warning"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit"
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
        {isAutorisee ? (
          <p className="mb-0">
            Veuillez renseigner l’historique du ces données budgétaires{" "}
            <strong>à l’échelle de votre structure.</strong> Aussi, le tableau
            des affectations reflète uniquement des flux annuels. Les montants
            saisis ne doivent en aucun cas être une estimation du stock.
          </p>
        ) : (
          <p className="mb-0">
            Veuillez renseigner l’historique du ces données budgétaires{" "}
            <strong>à l’échelle de votre structure.</strong>
          </p>
        )}
        <StructureTable />
      </fieldset>
      {wasInCpom && (
        <fieldset className="flex flex-col gap-6 min-w-0 w-full">
          <legend className="text-xl font-bold mb-8 text-title-blue-france">
            Gestion budgétaire du CPOM
          </legend>
          <CustomNotice
            severity="info"
            title=""
            className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit"
            description={`L’historique des données budgétaires à l’échelle du CPOM a déjà été renseigné lors de la saisie du CPOM. Si vous constatez une erreur et voulez apporter une modification, contactez-nous : ${BHASILE_CONTACT_EMAIL}`}
          />
          <StructureCpomTable canEdit={false} type={structure?.type} />
        </fieldset>
      )}
    </>
  );
};
