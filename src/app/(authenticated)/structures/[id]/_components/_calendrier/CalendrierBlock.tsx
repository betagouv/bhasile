import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { DateBars } from "@/app/(authenticated)/structures/[id]/_components/_calendrier/DateBars";
import { Block } from "@/app/components/common/Block";
import {
  getCurrentCpomStructureDates,
  isStructureInCpom,
} from "@/app/utils/structure.util";

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

  const isInCpom = isStructureInCpom(structure);
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

  if (isInCpom && dateStart && dateEnd) {
    datePairs.push({
      label: "CPOM en cours",
      dateStart: dateStart,
      dateEnd: dateEnd,
    });
  }

  return (
    <Block
      title="Calendrier"
      iconClass="fr-icon-calendar-2-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/02-calendrier`);
      }}
    >
      <DateBars datePairs={datePairs} />
    </Block>
  );
};
