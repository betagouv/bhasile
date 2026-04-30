"use client";

import { ReactNode } from "react";

import { Section } from "@/app/components/common/Section";

import { DescriptionBlock } from "./_components/DescriptionBlock";
import { DocumentsBlock } from "./_components/DocumentsBlock";

export default function OperateursPage(): ReactNode {
  return (
    <>
      <Section id="description">
        <DescriptionBlock />
      </Section>
      <Section id="documents">
        <DocumentsBlock />
      </Section>
    </>
  );
}
