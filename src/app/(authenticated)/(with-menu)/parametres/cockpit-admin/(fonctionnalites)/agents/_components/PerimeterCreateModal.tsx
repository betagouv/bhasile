"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactElement, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { formatPlural, pluralize } from "@/app/utils/string.util";
import { GrantScope } from "@/generated/prisma/enums";
import {
  perimeterFormSchema,
  PerimeterFormValues,
} from "@/schemas/forms/base/perimeter.schema";
import { PerimeterRead, ZoneOption } from "@/types/agent.type";
import {
  findPerimetersInZone,
  getDefaultPerimeterName,
} from "@/utils/perimeter.util";

export const PerimeterCreateModal = ({
  openCount,
  zones,
  perimeters,
  isSaving,
  onSubmit,
}: Props): ReactElement => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<PerimeterFormValues>({
    resolver: zodResolver(perimeterFormSchema),
    defaultValues: EMPTY_PERIMETER,
  });

  useEffect(() => {
    reset(EMPTY_PERIMETER);
  }, [openCount, reset]);

  const [scope, zoneId] = useWatch({ control, name: ["scope", "zoneId"] });
  const zoneOptions = zones.filter((zone) => zone.scope === scope);
  const zone = zoneOptions.find(({ id }) => id === zoneId);
  const perimetersInZone = zone ? findPerimetersInZone(perimeters, zone) : [];

  const selectZone = (nextZoneId: string): void => {
    setValue("zoneId", nextZoneId, { shouldValidate: true });
    const nextZone = zoneOptions.find(({ id }) => id === nextZoneId);
    setValue("name", nextZone ? getDefaultPerimeterName(nextZone) : "");
  };

  const submit = handleSubmit(async (values) => {
    if (await onSubmit(values)) {
      perimeterCreateModal.close();
    }
  });

  return (
    <perimeterCreateModal.Component
      title="Créer un périmètre"
      buttons={[
        { doClosesModal: true, children: "Annuler", type: "button" },
        {
          doClosesModal: false,
          children: "Créer le périmètre",
          type: "button",
          disabled: isSaving,
          onClick: submit,
        },
      ]}
    >
      <RadioButtons
        legend="Niveau"
        orientation="horizontal"
        options={SCOPES.map(({ value, label }) => ({
          label,
          nativeInputProps: {
            value,
            checked: scope === value,
            onChange: () => {
              setValue("scope", value);
              selectZone("");
            },
          },
        }))}
      />
      <Select
        label={scope === GrantScope.DEPARTEMENT ? "Département" : "Région"}
        nativeSelectProps={{
          value: zoneId,
          onChange: (event) => selectZone(event.target.value),
        }}
        state={errors.zoneId ? "error" : "default"}
        stateRelatedMessage={errors.zoneId?.message}
      >
        <option value="">Choisir</option>
        {zoneOptions.map(({ id, name }) => (
          <option key={id} value={id}>
            {scope === GrantScope.DEPARTEMENT ? `${id} – ${name}` : name}
          </option>
        ))}
      </Select>
      {perimetersInZone.length > 0 && (
        <Alert
          small
          severity="info"
          className="mb-6"
          description={`${formatPlural(perimetersInZone.length, "périmètre")} ${pluralize(perimetersInZone.length, "existe")} déjà sur cette zone : ${perimetersInZone.map(({ name }) => name).join(", ")}. Vérifiez qu’il en faut bien un autre.`}
        />
      )}
      <Input
        label="Nom du périmètre"
        hintText="Pré-rempli d’après la zone, modifiable"
        nativeInputProps={register("name")}
        state={errors.name ? "error" : "default"}
        stateRelatedMessage={errors.name?.message}
      />
    </perimeterCreateModal.Component>
  );
};

export const perimeterCreateModal = createModal({
  id: "perimeter-create-modal",
  isOpenedByDefault: false,
});

const SCOPES = [
  { value: GrantScope.DEPARTEMENT, label: "Départemental" },
  { value: GrantScope.REGION, label: "Régional" },
] as const;

const EMPTY_PERIMETER: PerimeterFormValues = {
  scope: GrantScope.DEPARTEMENT,
  zoneId: "",
  name: "",
};

type Props = {
  openCount: number;
  zones: ZoneOption[];
  perimeters: PerimeterRead[];
  isSaving: boolean;
  onSubmit: (values: PerimeterFormValues) => Promise<boolean>;
};
