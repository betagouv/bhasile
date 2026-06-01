import { ReactElement } from "react";

import { Table } from "@/app/components/common/Table";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActiviteMotifsIndisponibilite = (): ReactElement => {
  const { structure } = useStructureContext();
  const activite = structure.activites?.[0];

  const motifsIndisponibilite = [
    { label: "Désinsectisation", value: activite?.desinsectisation },
    { label: "Remise en état de l'unité", value: activite?.remiseEnEtat },
    { label: "Sous-occupation", value: activite?.sousOccupation },
    { label: "Travaux", value: activite?.travaux },
  ];

  return (
    <Table
      headings={["Motifs", "Places"]}
      ariaLabelledBy="indisponibilite-title"
      className="max-w-3xl [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12!"
      enableBorders
    >
      {motifsIndisponibilite.map((motifIndisponibilite) => (
        <tr key={motifIndisponibilite.label}>
          <td className="text-left! py-3!">{motifIndisponibilite.label}</td>
          <td className="py-3!">{motifIndisponibilite.value}</td>
        </tr>
      ))}
    </Table>
  );
};
