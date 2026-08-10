"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement, useEffect, useState } from "react";

import {
  formatAnomalieLabel,
  formatAnomalieStructure,
} from "@/app/utils/anomalie.util";
import { DashboardAnomalie } from "@/types/dashboard.type";

export const AnomalieJustificationModal = ({
  anomalie,
  isSaving,
  onSubmit,
}: Props): ReactElement => {
  const [commentaire, setCommentaire] = useState("");

  useEffect(() => {
    setCommentaire(anomalie?.commentaire ?? "");
  }, [anomalie]);

  const handleSubmit = async (): Promise<void> => {
    if (!anomalie) {
      return;
    }
    const isSaved = await onSubmit(anomalie, commentaire.trim());
    if (isSaved) {
      anomalieJustificationModal.close();
    }
  };

  return (
    <anomalieJustificationModal.Component
      title="Justifier l’anomalie"
      size="large"
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: "Valider",
          type: "button",
          disabled: isSaving || commentaire.trim().length === 0,
          onClick: handleSubmit,
        },
      ]}
    >
      {anomalie && (
        <>
          <p className="mb-1 text-sm text-mention-grey">
            {formatAnomalieStructure(anomalie)}
          </p>
          <p className="mb-4 font-bold">{formatAnomalieLabel(anomalie)}</p>
        </>
      )}

      <Input
        label="Justification"
        textArea
        nativeTextAreaProps={{
          value: commentaire,
          rows: 4,
          onChange: (event) => setCommentaire(event.target.value),
        }}
      />
    </anomalieJustificationModal.Component>
  );
};

export const anomalieJustificationModal = createModal({
  id: "anomalie-justification-modal",
  isOpenedByDefault: false,
});

type Props = {
  anomalie: DashboardAnomalie | null;
  isSaving: boolean;
  onSubmit: (
    anomalie: DashboardAnomalie,
    commentaire: string
  ) => Promise<boolean>;
};
