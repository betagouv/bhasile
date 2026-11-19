"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement, useEffect, useState } from "react";

import { AgentRead, PerimeterRead } from "@/types/agent.type";

import { PerimeterSelect } from "./PerimeterSelect";

export const AgentAccessModal = ({
  agent,
  openCount,
  perimeters,
  isSaving,
  onSubmit,
}: Props): ReactElement => {
  const [perimeterId, setPerimeterId] = useState("");

  useEffect(() => {
    setPerimeterId(agent?.perimeter ? String(agent.perimeter.id) : "");
  }, [agent, openCount]);

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

type Props = {
  agent: AgentRead | null;
  openCount: number;
  perimeters: PerimeterRead[];
  isSaving: boolean;
  onSubmit: (agentId: number, perimeterId: number) => Promise<boolean>;
};
