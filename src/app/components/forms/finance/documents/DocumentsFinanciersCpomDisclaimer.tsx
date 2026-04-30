import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";

export const DocumentsFinanciersCpomDisclaimer = ({ year }: Props) => {
  const { structure } = useStructureContext();

  return structure.isInCpomPerYear[year] ? (
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
