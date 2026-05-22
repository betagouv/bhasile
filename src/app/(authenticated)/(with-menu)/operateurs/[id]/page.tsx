"use client";

import { ReactNode } from "react";

import { Section } from "@/app/components/common/Section";

import { DescriptionBlock } from "./_components/DescriptionBlock";
import { DocumentsBlock } from "./_components/DocumentsBlock";
import { StatsCta } from "./_components/StatsCta";

export default function OperateursPage(): ReactNode {
  return (
    <>
      <Section id="description">
        <DescriptionBlock />
      </Section>
      <StatsCta />
      <Section id="documents">
        <DocumentsBlock />
      </Section>
    </>
  );
}
