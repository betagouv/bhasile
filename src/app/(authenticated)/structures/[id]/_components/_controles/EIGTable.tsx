import { Table } from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { formatDate } from "@/app/utils/date.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { DemarchesSimplifieesInfo } from "./DemarchesSimplifiesInfo";

export const EIGTable = (): ReactElement => {
  const { structure } = useStructureContext();
  const evenementsIndesirablesGraves = structure?.evenementsIndesirablesGraves;

  const getEvenementsIndesirablesGraves = () => {
    return evenementsIndesirablesGraves?.map((evenementIndesirableGrave) => [
      evenementIndesirableGrave.numeroDossier,
      formatDate(evenementIndesirableGrave.evenementDate),
      formatDate(evenementIndesirableGrave.declarationDate),
      evenementIndesirableGrave.type,
    ]);
  };

  return (
    <>
      <Table
        bordered={true}
        className="full-width-table"
        caption=""
        data={getEvenementsIndesirablesGraves() || []}
        headers={[
          "DOSSIER",
          "ÉVÉNEMENT",
          "DÉCLARATION",
          "NATURE DE L'INCIDENT",
        ]}
      />
      <DemarchesSimplifieesInfo />
    </>
  );
};
