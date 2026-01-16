import { ReactElement } from "react";

import { ActesAdministratifsBlock } from "./_actes-administratifs/ActesAdministratifsBlock";
import { ActiviteBlock } from "./_activite/ActiviteBlock";
import { CalendrierBlock } from "./_calendrier/CalendrierBlock";
import { HudaPrahdaControlesBlock } from "./_controles/HudaPrahdaControlesBlock";
import { PrahdaDescriptionBlock } from "./_description/PrahdaDescriptionBlock";
import { NotesBlock } from "./_notes/NotesBlock";
import { PrahdaTypePlaceBlock } from "./_type-places/PrahdaTypePlaceBlock";
import { Section } from "./Section";

export const PrahdaStructure = (): ReactElement => {
  return (
    <>
      <Section id="description">
        <PrahdaDescriptionBlock />
      </Section>
      <Section id="calendrier">
        <CalendrierBlock />
      </Section>
      <Section id="places">
        <PrahdaTypePlaceBlock />
      </Section>
      <Section id="controle">
        <HudaPrahdaControlesBlock />
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
