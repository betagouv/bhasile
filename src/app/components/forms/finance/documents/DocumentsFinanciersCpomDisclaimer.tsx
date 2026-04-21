import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { computeCpomDates } from "@/app/utils/cpom.util";

export const DocumentsFinanciersCpomDisclaimer = ({ year }: Props) => {
  const { structure } = useStructureContext();

  const isInCpom =
    structure.cpomStructures?.some((cpomStructure) => {
      const startYear = cpomStructure.dateStart
        ? new Date(cpomStructure.dateStart).getFullYear()
        : computeCpomDates(cpomStructure.cpom).dateStart
          ? new Date(computeCpomDates(cpomStructure.cpom).dateStart!).getFullYear()
          : undefined;
      const endYear = cpomStructure.dateEnd
        ? new Date(cpomStructure.dateEnd).getFullYear()
        : computeCpomDates(cpomStructure.cpom).dateEnd
          ? new Date(computeCpomDates(cpomStructure.cpom).dateEnd!).getFullYear()
          : undefined;
      return (
        startYear !== undefined &&
        endYear !== undefined &&
        startYear <= year &&
        endYear >= year
      );
    }) ?? false;

  return isInCpom ? (
    <p>
      En {year}, nous avons identifié que vous faisiez partie d’un CPOM. Selon
      vos pratiques, les documents financiers de votre structure peuvent être à
      l’échelle de la structure et/ou du CPOM et/ou regrouper les deux. Veuillez
      importer tous les documents en votre possession en précisant leur échelle.
    </p>
  ) : (
    <p>
      En {year}, nous avons identifié que vous ne faisiez pas partie d’un CPOM.
      Veuillez importer les documents ci-dessous.
    </p>
  );
};

type Props = {
  year: number;
};
