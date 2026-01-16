import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { isStructureInCpom } from "@/app/utils/structure.util";

export const DocumentsFinanciersCpomDisclaimer = ({ year }: Props) => {
  const { structure } = useStructureContext();

  console.log(year);
  const isInCpom = isStructureInCpom(structure /*year*/);

  return isInCpom ? (
    <p>
      En 2025, nous avons identifié que vous faisiez partie d’un CPOM. Selon vos
      pratiques, les documents financiers de votre structure peuvent être à
      l’échelle de la structure et/ou du CPOM et/ou regrouper les deux. Veuillez
      importer tous les documents en votre possession en précisant leur échelle.
    </p>
  ) : (
    <p>
      En 2022, nous avons identifié que vous ne faisiez pas partie d’un CPOM.
      Veuillez importer les documents ci-dessous.
    </p>
  );
};

type Props = {
  year: number;
};
