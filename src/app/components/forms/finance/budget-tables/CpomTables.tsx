import { useFormContext } from "react-hook-form";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { CpomMillesimeFormValues } from "@/schemas/forms/base/cpom.schema";

import { CpomTable } from "./CpomTable";

export const CpomTables = () => {
  const { watch } = useFormContext();
  const cpomMillesimes = watch("cpomMillesimes") as CpomMillesimeFormValues[];

  const structureTypes = [
    ...new Set(
      cpomMillesimes?.map((cpomMillesime) => cpomMillesime?.type) ?? []
    ),
  ];

  return (
    <>
      <p className="mb-0 max-w-3xl">
        Veuillez renseigner l’historique des données budgétaires{" "}
        <strong>à l’échelle de l’ensemble du CPOM</strong>. Aussi, le tableau
        des affectations reflète uniquement des flux annuels. Les montants
        saisis ne doivent en aucun cas être une estimation du stock.
      </p>
      {structureTypes.length > 1 && (
        <CustomNotice
          severity="info"
          title=""
          description="Nous avons détecté dans la composition de votre CPOM différents types de structures. Veuillez donc remplir le tableau pour chacun d’eux, en prenant en compte toutes le structures du type correspondant à chaque fois."
        />
      )}
      {structureTypes.map((structureType, index) => (
        <>
          <CpomTable
            key={structureType}
            type={structureType}
            showTitle={structureTypes.length > 1}
          />
          {index < structureTypes.length - 1 && <hr />}
        </>
      ))}
    </>
  );
};
