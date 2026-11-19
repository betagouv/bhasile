"use client";

import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactElement, useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  agentFormSchema,
  AgentFormValues,
} from "@/schemas/forms/base/agent.schema";
import { PerimeterRead } from "@/types/agent.type";

import { PerimeterSelect } from "./PerimeterSelect";

export const AgentAddModal = ({
  openCount,
  perimeters,
  isSaving,
  onSubmit,
}: Props): ReactElement => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgentFormValues>({ resolver: zodResolver(agentFormSchema) });

  useEffect(() => {
    reset({ email: "" });
  }, [openCount, reset]);

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
      <PerimeterSelect
        perimeters={perimeters}
        nativeSelectProps={register("perimeterId", { valueAsNumber: true })}
        errorMessage={errors.perimeterId?.message}
      />
    </agentAddModal.Component>
  );
};

export const agentAddModal = createModal({
  id: "agent-add-modal",
  isOpenedByDefault: false,
});

type Props = {
  openCount: number;
  perimeters: PerimeterRead[];
  isSaving: boolean;
  onSubmit: (values: AgentFormValues) => Promise<boolean>;
};
