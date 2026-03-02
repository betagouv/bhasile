"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import Notice from "@codegouvfr/react-dsfr/Notice";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import autoAnimate from "@formkit/auto-animate";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FieldSetAdresseAdministrative } from "@/app/components/forms/fieldsets/structure/FieldSetAdresseAdministrative";
import { FieldSetContacts } from "@/app/components/forms/fieldsets/structure/FieldSetContacts";
import FormWrapper from "@/app/components/forms/FormWrapper";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { OperateurAutocomplete } from "@/app/components/forms/OperateurAutocomplete";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  AjoutIdentificationFormValues,
  ajoutIdentificationSchema,
} from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { FormKind } from "@/types/global";
import { PublicType, StructureType } from "@/types/structure.type";

export default function FormIdentification() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const previousRoute = "/ajout-structure/selection";
  const resetRoute = `/ajout-structure/${params.id}/01-identification`;
  const nextRoute = isEditMode
    ? `/ajout-structure/${params.id}/05-verification`
    : `/ajout-structure/${params.id}/02-adresses`;
  const filialesContainerRef = useRef(null);

  useEffect(() => {
    if (filialesContainerRef.current) {
      autoAnimate(filialesContainerRef.current);
    }
  }, [filialesContainerRef]);

  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.id}-identification`, {});

  const [isManagedByAFiliale, setIsManagedByAFiliale] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [type, setType] = useState<string | undefined>(
    localStorageValues?.type
  );

  useEffect(() => {
    if (localStorageValues && !isInitialized) {
      setIsManagedByAFiliale(!!localStorageValues.filiale);
      setIsInitialized(true);
    }
  }, [localStorageValues, isInitialized]);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  // TODO : Refacto ce composant pour isoler la logique du localStorage et éviter les problèmes de réhydratation
  if (!isClient) {
    return null;
  }

  return (
    <FormWrapper
      schema={ajoutIdentificationSchema}
      localStorageKey={`ajout-structure-${params.id}-identification`}
      nextRoute={nextRoute}
      resetRoute={resetRoute}
      mode="onBlur"
      defaultValues={localStorageValues}
      submitButtonText={
        isEditMode ? "Modifier et revenir à la vérification" : "Étape suivante"
      }
    >
      {({ register, control }) => {
        return (
          <>
            <Link
              href={previousRoute}
              className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2 mb-8"
            >
              <i className="fr-icon-arrow-left-s-line before:w-4"></i>
              Revenir au choix de la structure
            </Link>
            <fieldset className="flex flex-col gap-6">
              <legend className="text-xl font-bold mb-10 text-title-blue-france">
                Description
              </legend>

              <InputWithValidation
                name="id"
                id="id"
                label=""
                control={control}
                type="hidden"
              />
              <InputWithValidation
                name="codeBhasile"
                id="codeBhasile"
                label=""
                control={control}
                type="hidden"
              />

              <div className="flex">
                <ToggleSwitch
                  label="Cette structure appartient-elle à une filiale d’opérateur (ex: YSOS, filiale de SOS) ?"
                  labelPosition="left"
                  showCheckedHint={false}
                  className="w-fit [&_label]:gap-2"
                  checked={isManagedByAFiliale}
                  name="managed-by-a-filiale"
                  id="managed-by-a-filiale"
                  onChange={() => setIsManagedByAFiliale(!isManagedByAFiliale)}
                />
                <p className="pl-2">{isManagedByAFiliale ? "Oui" : "Non"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectWithValidation
                  name="type"
                  control={control}
                  label="Type"
                  required
                  onChange={(event) => setType(event)}
                  id="type"
                >
                  <option value="">Sélectionnez un type</option>
                  {Object.values(StructureType)
                    .filter(
                      (structureType) => structureType !== StructureType.PRAHDA
                    )
                    .map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </SelectWithValidation>

                <OperateurAutocomplete />

                <div ref={filialesContainerRef}>
                  {isManagedByAFiliale && (
                    <InputWithValidation
                      name="filiale"
                      control={control}
                      type="text"
                      label="Filiale"
                      id="filiale"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputWithValidation
                  name="creationDate"
                  control={control}
                  type="date"
                  label="Date de création de la structure"
                  id="creationDate"
                />
                <SelectWithValidation
                  name="public"
                  control={control}
                  label="Public"
                  id="public"
                >
                  <option value="">Sélectionnez une option</option>
                  {Object.values(PublicType).map((publicType) => (
                    <option key={publicType} value={publicType}>
                      {publicType}
                    </option>
                  ))}
                </SelectWithValidation>
              </div>
              <Notice
                severity="info"
                title=""
                className="rounded [&_p]:flex [&_p]:items-center"
                description="LGBT : Lesbiennes, Gays, Bisexuels et Transgenres – FVV : Femmes Victimes de Violences–TEH : Traîte des Êtres Humains"
              />
              <label className="flex gap-6">
                Actuellement, la structure dispose-t-elle de places labellisées
                / spécialisées ?
                <Checkbox
                  options={[
                    {
                      label: "LGBT",
                      nativeInputProps: {
                        ...register("lgbt"),
                      },
                    },
                  ]}
                />
                <Checkbox
                  options={[
                    {
                      label: "FVV et TEH",
                      nativeInputProps: {
                        ...register("fvvTeh"),
                      },
                    },
                  ]}
                />
              </label>
            </fieldset>

            <hr />

            <FieldSetAdresseAdministrative formKind={FormKind.AJOUT} />

            <hr />

            <FieldSetDnasAndFinesses />

            <hr />
            <hr />

            <FieldSetContacts />

            <hr />
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold mb-4 text-title-blue-france">
                Calendrier
              </h2>
              {isStructureAutorisee(type) && (
                <fieldset className="flex flex-col gap-6">
                  <legend className="text-lg font-bold mb-2 text-title-blue-france">
                    Période d’autorisation en cours
                  </legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 w-1/2 gap-6">
                    <InputWithValidation
                      name="debutPeriodeAutorisation"
                      id="debutPeriodeAutorisation"
                      control={control}
                      type="date"
                      label="Date de début"
                    />

                    <InputWithValidation
                      name="finPeriodeAutorisation"
                      id="finPeriodeAutorisation"
                      control={control}
                      type="date"
                      label="Date de fin"
                    />
                  </div>
                </fieldset>
              )}

              <fieldset className="flex flex-col gap-6">
                <legend className="text-lg font-bold mb-2 text-title-blue-france">
                  Convention en cours
                  {isStructureAutorisee(type) ? " (optionnel)" : ""}
                </legend>
                {isStructureAutorisee(type) && (
                  <Notice
                    severity="info"
                    title=""
                    className="rounded [&_p]:flex  [&_p]:items-center"
                    description="Uniquement si votre structure est sous convention."
                  />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 w-1/2 gap-6">
                  <InputWithValidation
                    name="debutConvention"
                    id="debutConvention"
                    control={control}
                    type="date"
                    label="Date de début"
                  />

                  <InputWithValidation
                    name="finConvention"
                    id="finConvention"
                    control={control}
                    type="date"
                    label="Date de fin"
                  />
                </div>
              </fieldset>
            </div>
          </>
        );
      }}
    </FormWrapper>
  );
}
