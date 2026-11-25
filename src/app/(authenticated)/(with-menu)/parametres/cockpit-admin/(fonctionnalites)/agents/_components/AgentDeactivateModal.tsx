"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement } from "react";

import { AgentRead } from "@/types/agent.type";

export const AgentDeactivateModal = ({
  agent,
  isSaving,
  onConfirm,
}: Props): ReactElement => {
  const confirm = async (): Promise<void> => {
    if (agent && (await onConfirm(agent.id))) {
      agentDeactivateModal.close();
    }
  };

  return (
    <agentDeactivateModal.Component
      title="Désactiver l’agent"
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: "Désactiver",
          type: "button",
          disabled: isSaving,
          onClick: confirm,
        },
      ]}
    >
      <p className="mb-2">
        L’agent perd immédiatement l’accès à Bhasile. Son périmètre est conservé
        : il pourra être réactivé.
      </p>
      {agent && <p className="font-bold mb-0">{agent.name ?? agent.email}</p>}
    </agentDeactivateModal.Component>
  );
};

export const agentDeactivateModal = createModal({
  id: "agent-deactivate-modal",
  isOpenedByDefault: false,
});

type Props = {
  agent: AgentRead | null;
  isSaving: boolean;
  onConfirm: (agentId: number) => Promise<boolean>;
};
