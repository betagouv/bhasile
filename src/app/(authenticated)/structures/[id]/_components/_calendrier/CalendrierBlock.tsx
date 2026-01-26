import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { DateBars } from "@/app/(authenticated)/structures/[id]/_components/_calendrier/DateBars";
import { Block } from "@/app/components/common/Block";
import { getYearDate } from "@/app/utils/date.util";
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
  const { yearStart, yearEnd } = getCurrentCpomStructureDates(structure);

  const datePairs = [];
  if (debutPeriodeAutorisation && finPeriodeAutorisation) {
    datePairs.push({
      label: "Période d’autorisation",
      startDate: debutPeriodeAutorisation,
      endDate: finPeriodeAutorisation,
    });
  }
  if (debutConvention && finConvention) {
    datePairs.push({
      label: "Convention en cours",
      startDate: debutConvention,
      endDate: finConvention,
    });
  }

  // TODO: it shouldn't bet transformed in a date here. It should stay a year.
  if (isInCpom && yearStart && yearEnd) {
    datePairs.push({
      label: "CPOM en cours",
      startDate: getYearDate(yearStart),
      endDate: getYearDate(yearEnd),
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
