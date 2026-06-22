"use client";

import { ReactElement } from "react";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { Section } from "@/app/components/common/Section";

import { ActiviteBlock } from "./_components/activite/ActiviteBlock";
import { ControleQualiteBlock } from "./_components/controle-qualite/ControleQualiteBlock";
import { FinancesBlock } from "./_components/finances/FinancesBlock";
import { RMUBlock } from "./_components/rmu/RMUBlock";
import { StructuresBlock } from "./_components/structures/StructuresBlock";
import { TypesPlacesBlock } from "./_components/type-places/TypesPlacesBlock";

export default function Statistiques(): ReactElement {
  return (
    <>
      <CustomNotice
        severity="warning"
        title=""
        description="Les structures non finalisées et les PRAHDA ne sont pas comptabilisés ici."
        className="rounded-lg"
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
    </>
  );
}
