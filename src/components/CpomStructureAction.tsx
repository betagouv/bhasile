"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";
import { ReactElement } from "react";

import {
  useCanReadStructures,
  useCanUpdateStructures,
} from "@/app/hooks/useCanUpdateStructure";
import { cn } from "@/app/utils/classname.util";
import { openNoPermissionsModal } from "@/components/NoPermissionsModal";
import {
  CpomLinkedStructure,
  getCpomStructureAction,
} from "@/utils/structure-link.util";

export const CpomStructureAction = ({
  structure,
  arrowIconClass = "fr-icon-arrow-right-line",
  className,
}: Props): ReactElement | null => {
  const canReadStructure = useCanReadStructures();
  const canUpdateStructure = useCanUpdateStructures();

  const action = getCpomStructureAction(structure, {
    canReadStructure,
    canUpdateStructure,
  });

  if (!action) {
    return null;
  }

  if (action.kind === "finalisationForbidden") {
    return (
      <Button
        onClick={openNoPermissionsModal}
        priority="tertiary no outline"
        iconId="fr-icon-edit-line"
        className={className}
        title={action.title}
      />
    );
  }

  return (
    <Link
      href={action.href}
      className={cn(
        "fr-btn fr-btn--tertiary-no-outline",
        action.kind === "finalisation" ? "fr-icon-edit-line" : arrowIconClass,
        className
      )}
      title={action.title}
      aria-label={action.title}
    />
  );
};

type Props = {
  structure: CpomLinkedStructure;
  arrowIconClass?: string;
  className?: string;
};
