"use client";

import { ReactNode } from "react";

import { Section } from "@/app/components/common/Section";

//import { ActesAdministratifsBlock } from "./_actes-administratifs/ActesAdministratifsBlock";
import { CompositionBlock } from "./_components/composition/CompositionBlock";
import { DescriptionBlock } from "./_components/description/DescriptionBlock";
// import { FinancesBlock } from "./_finances/FinancesBlock";

export default function CpomPage(): ReactNode {
  return (
    <>
      <Section id="description">
        <DescriptionBlock />
      </Section>
      <Section id="composition">
        <CompositionBlock />
      </Section>
      {/* <Section id="finances">
        <FinancesBlock />
      </Section>
      <Section id="actes-administratifs">
        <ActesAdministratifsBlock />
      </Section> */}
    </>
  );
}
