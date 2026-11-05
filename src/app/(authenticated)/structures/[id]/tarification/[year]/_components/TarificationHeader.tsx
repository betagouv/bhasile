import Link from "next/link";
import { ComponentProps, ReactElement } from "react";

import { StructureHeaderContent } from "@/components/structures/StructureHeaderContent";

import { OutOfBhasileButton } from "./OutOfBhasileButton";

export const TarificationHeader = ({
  structureId,
  year,
  canDeclareOutOfBhasile,
  structure,
}: Props): ReactElement => (
  <div className="shrink-0 sticky top-0 z-40 flex items-center gap-2 bg-white border-b border-b-border-default-grey px-6 py-3">
    <Link
      href={`/structures/${structureId}`}
      className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line"
      title="Retour à la fiche structure"
    >
      Retour à la fiche structure
    </Link>
    <StructureHeaderContent title="Campagne de tarification" {...structure} />
    <div className="grow" />
    <OutOfBhasileButton
      structureId={structureId}
      year={year}
      isAvailable={canDeclareOutOfBhasile}
    />
    <Link
      href={`/structures/${structureId}`}
      className="fr-btn fr-btn--tertiary-no-outline fr-icon-close-line"
      title="Fermer"
    >
      Fermer
    </Link>
  </div>
);

type Props = {
  structureId: number;
  year: number;
  canDeclareOutOfBhasile: boolean;
  structure: Omit<ComponentProps<typeof StructureHeaderContent>, "title">;
};
