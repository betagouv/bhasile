"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { formatCivilDate } from "@/app/utils/date.util";

import type { ActionRequest } from "./TarificationActionModal";

export const L48ResponseButtons = ({
  contradictoireDeadline,
  respondToL48,
  onRequest,
}: Props): ReactElement => {
  const requestResponse = (type: L48Response["type"], title: string) =>
    onRequest({
      title,
      description: contradictoireDeadline
        ? `Vous pourrez modifier votre réponse jusqu’au ${formatCivilDate(contradictoireDeadline)}.`
        : "Vous pourrez modifier votre réponse jusqu’à l’échéance.",
      textLabel: "Observations (facultatif)",
      canAttachFile: true,
      confirmLabel: title,
      onConfirm: ({ text, file }) => respondToL48({ type, text, file }),
    });

  return (
    <>
      <Button
        priority="secondary"
        onClick={() => requestResponse("L48_CONTESTED", "Je conteste la L48")}
      >
        Je conteste
      </Button>
      <Button
        onClick={() => requestResponse("L48_ACCEPTED", "J’accepte la L48")}
      >
        J’accepte
      </Button>
    </>
  );
};

export type L48Response = {
  type: "L48_ACCEPTED" | "L48_CONTESTED";
  text: string;
  file: File | null;
};

type Props = {
  contradictoireDeadline: string | null;
  respondToL48: (response: L48Response) => Promise<void>;
  onRequest: (request: ActionRequest) => void;
};
