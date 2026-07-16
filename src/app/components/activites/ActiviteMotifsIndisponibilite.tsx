import { ReactElement } from "react";

import { Table } from "@/app/components/common/Table";

export const ActiviteMotifsIndisponibilite = ({
  desinsectisation,
  remiseEnEtat,
  sousOccupation,
  travaux,
}: Props): ReactElement => {
  const motifsIndisponibilite = [
    { label: "Désinsectisation", value: desinsectisation },
    { label: "Remise en état de l'unité", value: remiseEnEtat },
    { label: "Sous-occupation", value: sousOccupation },
    { label: "Travaux", value: travaux },
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

type Props = {
  desinsectisation?: number | null;
  remiseEnEtat?: number | null;
  sousOccupation?: number | null;
  travaux?: number | null;
};
