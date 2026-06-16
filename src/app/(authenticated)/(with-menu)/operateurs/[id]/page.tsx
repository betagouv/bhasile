"use client";

import { ReactNode } from "react";

import { Section } from "@/app/components/common/Section";

import { ActesAdministratifsOperateur } from "./_components/ActesAdministratifsOperateur";
import { ContactsBlock } from "./_components/ContactsBlock";
import { DescriptionBlock } from "./_components/DescriptionBlock";
import { StatsCta } from "./_components/StatsCta";

export default function OperateursPage(): ReactNode {
  return (
    <>
      <Section id="description">
        <DescriptionBlock />
      </Section>
      <StatsCta />
      <Section id="contacts">
        <ContactsBlock />
      </Section>
      <Section id="documents">
        <ActesAdministratifsOperateur />
      </Section>
    </>
  );
}
