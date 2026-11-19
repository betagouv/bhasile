"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement, useEffect, useState } from "react";

import { AgentRead, PerimeterRead } from "@/types/agent.type";

import { PerimeterSelect } from "./PerimeterSelect";

export const AgentAccessModal = ({
  target,
  openCount,
  perimeters,
  isSaving,
  onSubmit,
  onCreatePerimeter,
}: Props): ReactElement => {
  const agent = target?.agent ?? null;
  const [perimeterId, setPerimeterId] = useState("");

  useEffect(() => {
    const initialPerimeterId =
      target?.perimeterId ?? target?.agent.perimeter?.id;
    setPerimeterId(initialPerimeterId ? String(initialPerimeterId) : "");
  }, [target, openCount]);

  const { title, confirmLabel } = getModalLabels(agent);

  const submit = async (): Promise<void> => {
    if (agent && (await onSubmit(agent.id, Number(perimeterId)))) {
      agentAccessModal.close();
    }
  };

  return (
    <agentAccessModal.Component
      title={title}
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: confirmLabel,
          type: "button",
          disabled: isSaving || !perimeterId,
          onClick: submit,
        },
      ]}
    >
      {agent && <p className="font-bold">{agent.name ?? agent.email}</p>}
      <PerimeterSelect
        perimeters={perimeters}
        nativeSelectProps={{
          value: perimeterId,
          onChange: (event) => setPerimeterId(event.target.value),
        }}
      />
      {agent && (
        <Button
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-add-line"
          onClick={() => onCreatePerimeter(agent)}
        >
          Créer un périmètre
        </Button>
      )}
    </agentAccessModal.Component>
  );
};

export const agentAccessModal = createModal({
  id: "agent-access-modal",
  isOpenedByDefault: false,
});

const getModalLabels = (agent: AgentRead | null) => {
  if (agent?.status === "ACTIVATED") {
    return { title: "Changer de périmètre", confirmLabel: "Enregistrer" };
  }
  if (agent?.status === "DEACTIVATED") {
    return { title: "Réactiver l’agent", confirmLabel: "Réactiver" };
  }
  return { title: "Valider l’agent", confirmLabel: "Valider" };
};

export type AgentAccessTarget = {
  agent: AgentRead;
  perimeterId?: number;
};

type Props = {
  target: AgentAccessTarget | null;
  openCount: number;
  perimeters: PerimeterRead[];
  isSaving: boolean;
  onSubmit: (agentId: number, perimeterId: number) => Promise<boolean>;
  onCreatePerimeter: (agent: AgentRead) => void;
};
