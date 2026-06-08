"use client";

import { ReactElement } from "react";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { Section } from "@/app/components/common/Section";

import { StructuresBlock } from "./_components/structures/StructuresBlock";

export default function Statistiques(): ReactElement {
  return (
    <>
      <CustomNotice
        severity="warning"
        title=""
        description="Les structures non finalisées et les PRAHDA ne sont pas comptabilisés ici."
      />
      <Section id="structures">
        <StructuresBlock />
      </Section>
    </>
  );
}
