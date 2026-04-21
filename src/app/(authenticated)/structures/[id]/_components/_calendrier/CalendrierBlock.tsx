import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { DateBars } from "@/app/(authenticated)/structures/[id]/_components/_calendrier/DateBars";
import { Block } from "@/app/components/common/Block";
import { getCurrentCpomStructureDates } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const CalendrierBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

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
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/calendrier`);
      }}
      entity={structure}
      entityType="Structure"
    >
      <DateBars datePairs={datePairs} />
    </Block>
  );
};
