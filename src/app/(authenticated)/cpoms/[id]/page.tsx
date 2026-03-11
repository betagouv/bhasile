import { ReactElement } from "react";

import { Section } from "@/app/components/common/Section";

import { ActesAdministratifsBlock } from "./_actes-administratifs/ActesAdministratifsBlock";
import { ActiviteBlock } from "./_activite/ActiviteBlock";
import { CalendrierBlock } from "./_calendrier/CalendrierBlock";
import { ControlesBlock } from "./_controles/ControlesBlock";
import { DescriptionBlock } from "./_description/DescriptionBlock";
import { FinancesBlock } from "./_finances/FinancesBlock";
import { NotesBlock } from "./_notes/NotesBlock";
import { TypePlaceBlock } from "./_type-places/TypePlaceBlock";

export const Structure = (): ReactElement => {
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
      <Section id="controle">
        <ControlesBlock />
      </Section>
      <Section id="activites">
        <ActiviteBlock />
      </Section>
      <Section id="actes-administratifs">
        <ActesAdministratifsBlock />
      </Section>
      <Section id="notes">
        <NotesBlock />
      </Section>
    </>
  );
};
