import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { getCurrentCpomStructureDates } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { DateBars } from "./DateBars";

export const CalendrierBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const {
    debutPeriodeAutorisation,
    finPeriodeAutorisation,
    debutConvention,
    finConvention,
  } = structure;

  const { dateStart, dateEnd } = getCurrentCpomStructureDates(structure);

  const datePairs = [];
  if (debutPeriodeAutorisation && finPeriodeAutorisation) {
    datePairs.push({
      label: "Période d’autorisation",
      dateStart: debutPeriodeAutorisation,
      dateEnd: finPeriodeAutorisation,
    });
  }
  if (debutConvention && finConvention) {
    datePairs.push({
      label: "Convention en cours",
      dateStart: debutConvention,
      dateEnd: finConvention,
    });
  }

  if (structure.isInCpom && dateStart && dateEnd) {
    datePairs.push({
      label: "CPOM en cours",
      dateStart: dateStart,
      dateEnd: dateEnd,
    });
  }

  return (
    <Block
      title="Calendrier"
      iconClass="fr-icon-calendar-todo-line"
      disclaimer={
        <p className="text-sm text-title-blue-france mb-0">
          Données issues des actes administratifs
        </p>
      }
      entity={structure}
      entityType="Structure"
    >
      <DateBars datePairs={datePairs} />
    </Block>
  );
};
