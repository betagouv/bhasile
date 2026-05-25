"use client";

import { ReactNode } from "react";

import { Section } from "@/app/components/common/Section";

import { ActesAdministratifsOperateur } from "./_components/ActesAdministratifsOperateur";
import { DescriptionBlock } from "./_components/DescriptionBlock";

export default function OperateursPage(): ReactNode {
  return (
    <>
      <Section id="description">
        <DescriptionBlock />
      </Section>
      <Section id="documents">
        <ActesAdministratifsOperateur />
      </Section>
    </>
  );
}
