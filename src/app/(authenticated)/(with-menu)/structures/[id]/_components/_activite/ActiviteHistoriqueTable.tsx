import dayjs from "dayjs";
import { ReactElement, ReactNode } from "react";

import { Badge, BadgeType } from "@/app/components/common/Badge";
import { Table } from "@/app/components/common/Table";
import { ActiviteApiType } from "@/schemas/api/activite.schema";
import { ActiviteByMonthStat } from "@/schemas/api/statistique.schema";

import { typesActivite } from "./activite.constants";

export const ActiviteHistoriqueTable = ({ activites }: Props): ReactElement => {
  const getActiviteFor = (
    key: keyof ActiviteApiType | keyof ActiviteByMonthStat
  ) => {
    return activites
      ?.map((activite) => {
        return (activite as Record<string, string | number | null>)[key];
      })
      .reverse();
  };

  const activiteTypes: ActiviteType[] = [
    {
      id: "placesEnregistrees",
      label: "Places enregistrées DNA",
      activites: getActiviteFor("placesEnregistreesDna"),
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
      id: "presencesInduesTotal",
      label: "Présences indues totales",
      activites: getActiviteFor("presencesInduesTotal"),
      seuil: typesActivite["presencesInduesTotal"]?.seuil,
    },
  ];

  const getHeadings = () => {
    const dates =
      activites
        ?.map((activite) => {
          const date = dayjs(activite.date);
          const month = date.format("MMMM").toUpperCase();
          const year = date.format("YYYY");
          return (
            <th scope="col" key={`${month}-${year}`}>
              {month}
              <br />
              {year}
            </th>
          );
        })
        .reverse() ?? [];

    return [
      <th scope="col" key="heading-label" className="min-w-[240px]">
        {" "}
      </th>,
      ...dates,
    ];
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
    if (activiteType.id === "presencesInduesTotal") {
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
      className="text-mention-grey [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12! w-full"
      enableBorders
      stickFirstColumn
      defaultScrollRight
    >
      {activiteTypes.map((activiteType) => (
        <tr key={activiteType.label}>
          <td className="text-left! py-3! min-w-[240px]">
            <strong>{activiteType.label}</strong>
            <br />
            {activiteType.subLabel}
          </td>
          {activiteType.activites?.map((activite, index) => (
            <td
              key={`${activiteType.label}-${index}`}
              className="min-w-[132px] whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-6">
                <span>{activite?.toString()}</span>
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
              </span>
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

type Props = {
  activites: ActiviteApiType[] | ActiviteByMonthStat[];
};
