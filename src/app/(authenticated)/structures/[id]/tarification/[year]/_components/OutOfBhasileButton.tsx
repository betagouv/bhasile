"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useState } from "react";

import { TarificationEventType } from "@/generated/prisma/enums";
import { useTarificationActions } from "@/hooks/useTarificationActions";

import {
  type ActionRequest,
  TarificationActionModal,
} from "./TarificationActionModal";

export const OutOfBhasileButton = ({
  structureId,
  year,
}: Props): ReactElement => {
  const { recordEvent } = useTarificationActions({ structureId, year });
  const [request, setRequest] = useState<ActionRequest | null>(null);

  return (
    <>
      <Button
        priority="tertiary no outline"
        size="small"
        onClick={() =>
          setRequest({
            title: "Déclarer la tarification hors Bhasile",
            description: `Plus aucune étape de la campagne ${year} ne sera en retard pour cette structure. Cette déclaration ne s’annule pas.`,
            textLabel: "Motif",
            isTextRequired: true,
            confirmLabel: "Déclarer hors Bhasile",
            onConfirm: ({ text }) =>
              recordEvent({
                type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
                text,
              }),
          })
        }
      >
        Hors Bhasile
      </Button>
      <TarificationActionModal
        modalId="tarification-out-of-bhasile"
        request={request}
        onClose={() => setRequest(null)}
      />
    </>
  );
};

type Props = {
  structureId: number;
  year: number;
};
