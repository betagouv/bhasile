"use client";

import { ReactNode } from "react";

import { Section } from "@/app/components/common/Section";

import { ActesAdministratifsBlock } from "./_components/ActesAdministratifsBlock";
import { CompositionBlock } from "./_components/CompositionBlock";
import { DescriptionBlock } from "./_components/DescriptionBlock";
import { FinancesBlock } from "./_components/FinancesBlock";

export default function CpomPage(): ReactNode {
  return (
    <>
      <Section id="description">
        <DescriptionBlock />
      </Section>
      <Section id="composition">
        <CompositionBlock />
      </Section>
      <Section id="finances">
        <FinancesBlock />
      </Section>
      <Section id="actes-administratifs">
        <ActesAdministratifsBlock />
      </Section>
    </>
  );
}
