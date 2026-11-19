"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { ReactElement, useEffect, useState } from "react";

import { AccountStatus } from "@/app/api/users/user.util";
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

  const { title, confirmLabel } = ACCESS_ACTIONS[agent?.status ?? "PENDING"];

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

export const ACCESS_ACTIONS: Record<
  AccountStatus,
  { label: string; title: string; confirmLabel: string }
> = {
  PENDING: {
    label: "Valider",
    title: "Valider l’agent",
    confirmLabel: "Valider",
  },
  ACTIVATED: {
    label: "Changer de périmètre",
    title: "Changer de périmètre",
    confirmLabel: "Enregistrer",
  },
  DEACTIVATED: {
    label: "Réactiver",
    title: "Réactiver l’agent",
    confirmLabel: "Réactiver",
  },
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
