"use client";

import { useSession } from "next-auth/react";
import { ReactElement, useEffect } from "react";

import { Section } from "@/app/components/common/Section";
import { useUserAction } from "@/app/hooks/useUserAction";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { isAgent } from "@/lib/casl";
import { SessionUser } from "@/types/global";
import { isSomeDataIncomplete } from "@/utils/statistiques.util";

import { ActiviteBlock } from "./activite/ActiviteBlock";
import { ControleQualiteBlock } from "./controle-qualite/ControleQualiteBlock";
import { FinancesBlock } from "./finances/FinancesBlock";
import { PartialDataNotice } from "./PartialDataNotice";
import { RMUBlock } from "./rmu/RMUBlock";
import { StatistiquesCallouts } from "./StatistiquesCallouts";
import { StructuresBlock } from "./structures/StructuresBlock";
import { TypesPlacesBlock } from "./type-places/TypesPlacesBlock";

export const StatistiquesContent = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const { trackStatistiques } = useUserAction();
  const { data } = useSession();

  useEffect(() => {
    trackStatistiques();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3 px-3 pt-3">
      <StatistiquesCallouts />
      {isSomeDataIncomplete(statistiques) && <PartialDataNotice />}
      <Section id="structures">
        <StructuresBlock />
      </Section>
      <Section id="types-places">
        <TypesPlacesBlock />
      </Section>
      <Section id="finance">
        <FinancesBlock />
      </Section>
      <Section id="controle-qualite">
        <ControleQualiteBlock />
      </Section>
      <Section id="activite">
        <ActiviteBlock />
      </Section>
      {isAgent(data?.user as SessionUser) && (
        <Section id="rmu">
          <RMUBlock />
        </Section>
      )}
    </div>
  );
};
