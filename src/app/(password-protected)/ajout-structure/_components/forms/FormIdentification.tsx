"use client";

import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import Notice from "@codegouvfr/react-dsfr/Notice";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import autoAnimate from "@formkit/auto-animate";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { ContactType } from "@/types/contact.type";
import { PublicType, StructureType } from "@/types/structure-type.type";

export default function FormIdentification() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const previousRoute = "/ajout-structure/selection";
  const resetRoute = `/ajout-structure/${params.dnaCode}/01-identification`;
  const nextRoute = isEditMode
    ? `/ajout-structure/${params.dnaCode}/05-verification`
    : `/ajout-structure/${params.dnaCode}/02-adresses`;
  const filialesContainerRef = useRef(null);

  useEffect(() => {
    if (filialesContainerRef.current) {
      autoAnimate(filialesContainerRef.current);
    }
  }, [filialesContainerRef]);

  const defaultType = useMemo(() => {
    if (!params.dnaCode) {
      return undefined;
    }
    const dnaCode = params.dnaCode as string;

    if (dnaCode.startsWith("C")) {
      return StructureType.CADA;
    }
    if (dnaCode.startsWith("H")) {
      return StructureType.HUDA;
    }
    if (dnaCode.startsWith("K")) {
      return StructureType.CAES;
    }
    if (dnaCode.startsWith("R")) {
      return StructureType.CPH;
    }
    return undefined;
  }, [params.dnaCode]);

  const defaultValues = useMemo(() => {
    return {
      type: defaultType,
    };
  }, [defaultType]);

  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.dnaCode}-identification`, {});

  const mergedDefaultValues = useMemo(() => {
    return {
      ...defaultValues,
      ...localStorageValues,
    };
  }, [defaultValues, localStorageValues]);

  const [isManagedByAFiliale, setIsManagedByAFiliale] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [type, setType] = useState<string | undefined>(
    localStorageValues?.type ?? defaultType
  );

  useEffect(() => {
    if (localStorageValues && !isInitialized) {
      setIsManagedByAFiliale(!!localStorageValues.filiale);
      setIsInitialized(true);
    }
  }, [localStorageValues, isInitialized]);

  // Synchronise type avec localStorage OU defaultType, à chaque changement de dnaCode
  useEffect(() => {
    // Quand le dnaCode ou le localStorage change, on recalcule type
    setType(localStorageValues?.type ?? defaultType);
  }, [localStorageValues?.type, defaultType]);

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
      localStorageKey={`ajout-structure-${params.dnaCode}-identification`}
      nextRoute={nextRoute}
      resetRoute={resetRoute}
      mode="onBlur"
      defaultValues={mergedDefaultValues}
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

              <input
                type="hidden"
                id="dnaCode"
                {...register("dnaCode")}
                defaultValue={params.dnaCode}
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
                {isStructureAutorisee(type) && (
                  <InputWithValidation
                    name="finessCode"
                    control={control}
                    type="text"
                    label="Code FINESS"
                    id="finessCode"
                  />
                )}
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

            <h2 className="text-xl font-bold mb-0 text-title-blue-france">
              Contacts
            </h2>

            <Notice
              severity="info"
              title=""
              className="rounded [&_p]:flex [&_p]:items-center"
              description="Veuillez renseigner en contact principal la personne responsable de la structure et en contact secondaire la personne en charge du suivi opérationnel et/ou de la gestion budgétaire et financière."
            />

            <fieldset className="flex flex-col gap-6">
              <legend className="text-lg font-bold mb-4 text-title-blue-france">
                Contact principal
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputWithValidation
                  name="contactPrincipal.type"
                  id="contactPrincipal.type"
                  control={control}
                  type="hidden"
                  label="type"
                  defaultValue={ContactType.PRINCIPAL}
                />
                <InputWithValidation
                  name="contactPrincipal.prenom"
                  id="contactPrincipal.prenom"
                  control={control}
                  type="text"
                  label="Prénom"
                />
                <InputWithValidation
                  name="contactPrincipal.nom"
                  id="contactPrincipal.nom"
                  control={control}
                  type="text"
                  label="Nom"
                />
                <InputWithValidation
                  name="contactPrincipal.role"
                  id="contactPrincipal.role"
                  control={control}
                  type="text"
                  label="Fonction"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWithValidation
                  name="contactPrincipal.email"
                  id="contactPrincipal.email"
                  control={control}
                  type="email"
                  label="Email"
                />
                <InputWithValidation
                  name="contactPrincipal.telephone"
                  id="contactPrincipal.telephone"
                  control={control}
                  type="tel"
                  label="Téléphone"
                />
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-6">
              <legend className="text-lg font-bold mb-4 text-title-blue-france">
                Contact secondaire
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputWithValidation
                  name="contactSecondaire.type"
                  id="contactSecondaire.type"
                  control={control}
                  type="hidden"
                  label="type"
                  defaultValue={ContactType.SECONDAIRE}
                />
                <InputWithValidation
                  name="contactSecondaire.prenom"
                  id="contactSecondaire.prenom"
                  control={control}
                  type="text"
                  label="Prénom"
                />
                <InputWithValidation
                  name="contactSecondaire.nom"
                  id="contactSecondaire.nom"
                  control={control}
                  type="text"
                  label="Nom"
                />
                <InputWithValidation
                  name="contactSecondaire.role"
                  id="contactSecondaire.role"
                  control={control}
                  type="text"
                  label="Fonction"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWithValidation
                  name="contactSecondaire.email"
                  id="contactSecondaire.email"
                  control={control}
                  type="email"
                  label="Email"
                />
                <InputWithValidation
                  name="contactSecondaire.telephone"
                  id="contactSecondaire.telephone"
                  control={control}
                  type="tel"
                  label="Téléphone"
                />
              </div>
            </fieldset>

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
