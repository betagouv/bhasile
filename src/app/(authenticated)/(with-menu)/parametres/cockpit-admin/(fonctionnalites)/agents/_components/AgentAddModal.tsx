"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactElement, useEffect } from "react";
import { useController, useForm } from "react-hook-form";

import {
  agentFormSchema,
  AgentFormValues,
} from "@/schemas/forms/base/agent.schema";
import { PerimeterRead } from "@/types/agent.type";

import { PerimeterPicker } from "./PerimeterPicker";

export const AgentAddModal = ({
  draft,
  openCount,
  perimeters,
  isSaving,
  onSubmit,
  onCreatePerimeter,
}: Props): ReactElement => {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<AgentFormValues>({ resolver: zodResolver(agentFormSchema) });
  const { field: perimeterField } = useController({
    control,
    name: "perimeterId",
  });

  useEffect(() => {
    reset({ email: draft?.email ?? "", perimeterId: draft?.perimeterId });
  }, [draft, openCount, reset]);

  const submit = handleSubmit(async (values) => {
    if (await onSubmit(values)) {
      agentAddModal.close();
    }
  });

  return (
    <agentAddModal.Component
      title="Ajouter un agent"
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: "Ajouter et activer",
          type: "button",
          disabled: isSaving,
          onClick: submit,
        },
      ]}
    >
      <p>
        Pour un agent qui ne s’est encore jamais connecté : son compte est créé
        activé, il aura ses droits dès sa première connexion ProConnect.
      </p>
      <Input
        label="Adresse mail"
        nativeInputProps={{ ...register("email"), type: "email" }}
        state={errors.email ? "error" : "default"}
        stateRelatedMessage={errors.email?.message}
      />
      <PerimeterPicker
        key={openCount}
        perimeters={perimeters}
        perimeterId={perimeterField.value}
        onChange={perimeterField.onChange}
        errorMessage={errors.perimeterId?.message}
      />
      <Button
        priority="tertiary no outline"
        size="small"
        iconId="fr-icon-add-line"
        onClick={() => onCreatePerimeter({ email: getValues("email") })}
      >
        Créer un périmètre
      </Button>
    </agentAddModal.Component>
  );
};

export const agentAddModal = createModal({
  id: "agent-add-modal",
  isOpenedByDefault: false,
});

export type AgentDraft = {
  email?: string;
  perimeterId?: number;
};

type Props = {
  draft: AgentDraft | null;
  openCount: number;
  perimeters: PerimeterRead[];
  isSaving: boolean;
  onSubmit: (values: AgentFormValues) => Promise<boolean>;
  onCreatePerimeter: (draft: AgentDraft) => void;
};
