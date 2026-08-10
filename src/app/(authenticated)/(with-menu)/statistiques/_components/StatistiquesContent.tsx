"use client";

import { ReactElement } from "react";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { Section } from "@/app/components/common/Section";

import { ActiviteBlock } from "./activite/ActiviteBlock";
import { ControleQualiteBlock } from "./controle-qualite/ControleQualiteBlock";
import { FinancesBlock } from "./finances/FinancesBlock";
import { RMUBlock } from "./rmu/RMUBlock";
import { StructuresBlock } from "./structures/StructuresBlock";
import { TypesPlacesBlock } from "./type-places/TypesPlacesBlock";

export const StatistiquesContent = (): ReactElement => {
  return (
    <div className="flex flex-col gap-3 px-3 pt-3">
      <CustomNotice
        severity="warning"
        description="Les structures non finalisées et les PRAHDA ne sont pas comptabilisés ici."
        className="rounded-lg bg-contrast-yellow-tournesol text-action-high-yellow-tournesol"
      />
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
      <Section id="rmu">
        <RMUBlock />
      </Section>
    </div>
  );
};
