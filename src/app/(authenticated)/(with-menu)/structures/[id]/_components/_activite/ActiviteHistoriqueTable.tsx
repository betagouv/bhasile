import dayjs from "dayjs";
import { ReactElement, ReactNode } from "react";

import { Badge, BadgeType } from "@/app/components/common/Badge";
import { Table } from "@/app/components/common/Table";
import { ActiviteApiType } from "@/schemas/api/activite.schema";

import { useStructureContext } from "../../_context/StructureClientContext";
import { typesActivite } from "./activite.constants";

export const ActiviteHistoriqueTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const getActiviteFor = (key: keyof ActiviteApiType) => {
    return structure.activites?.map((activite) => activite[key]).reverse();
  };

  const activiteTypes: ActiviteType[] = [
    {
      id: "placesEnregistrees",
      label: "Places enregistrées DNA",
      activites: getActiviteFor("placesAutorisees"),
    },
    {
      id: "placesIndisponibles",
      label: "Indisponibilité",
      subLabel: <span>Seuil cible à 3&nbsp;%</span>,
      activites: getActiviteFor("placesIndisponibles"),
      seuil: typesActivite["placesIndisponibles"]?.seuil,
    },
    {
      id: "presencesInduesBPI",
      label: "Présences indues BPI",
      subLabel: <span>Seuil cible à 3&nbsp;%</span>,
      activites: getActiviteFor("presencesInduesBPI"),
      seuil: typesActivite["presencesInduesBPI"]?.seuil,
    },
    {
      id: "presencesInduesDeboutees",
      label: "Présences indues déboutées",
      subLabel: <span>Seuil cible à 4&nbsp;%</span>,
      activites: getActiviteFor("presencesInduesDeboutees"),
      seuil: typesActivite["presencesInduesDeboutees"]?.seuil,
    },
    {
      id: "presencesIndues",
      label: "Présences indues totales",
      activites: getActiviteFor("presencesIndues"),
      seuil: typesActivite["presencesIndues"]?.seuil,
    },
  ];

  const getHeadings = () => {
    const dates = structure.activites
      ?.map((activite) => dayjs(activite.date).format("MMMM YYYY"))
      .reverse();
    return ["", ...(dates || [])];
  };

  const computeSeuil = (
    activite: string | number | null,
    index: number
  ): string => {
    const placesEnregistrees = activiteTypes.find(
      (activiteType) => activiteType.id === "placesEnregistrees"
    )?.activites?.[index];
    if (!placesEnregistrees) {
      return "0";
    }
    const percentage = (Number(activite) / Number(placesEnregistrees)) * 100;
    return percentage.toFixed(0);
  };

  const getBadgeType = (
    seuil: string,
    activiteType: ActiviteType
  ): BadgeType => {
    if (activiteType.id === "presencesIndues") {
      return "disabled";
    }
    if (Number(seuil) > Number(activiteType.seuil)) {
      return "error";
    }
    return "success";
  };

  return (
    <Table
      headings={getHeadings()}
      ariaLabelledBy="activite-historique-title"
      className="[&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
      enableBorders
      stickFirstColumn
    >
      {activiteTypes.map((activiteType) => (
        <tr key={activiteType.label}>
          <td className="text-left! py-3! min-w-[200px]">
            <strong>{activiteType.label}</strong>
            <br />
            {activiteType.subLabel}
          </td>
          {activiteType.activites?.map((activite, index) => (
            <td key={`${activiteType.label}-${index}`}>
              <span className="pr-2">{activite?.toString()}</span>&nbsp;
              {activiteType.seuil && (
                <Badge
                  type={getBadgeType(
                    computeSeuil(activite, index),
                    activiteType
                  )}
                >
                  {computeSeuil(activite, index)}%
                </Badge>
              )}
            </td>
          ))}
        </tr>
      ))}
    </Table>
  );
};

type ActiviteType = {
  id: string;
  label: string;
  subLabel?: ReactNode;
  activites?: (string | number | null)[];
  seuil?: number | null;
};
