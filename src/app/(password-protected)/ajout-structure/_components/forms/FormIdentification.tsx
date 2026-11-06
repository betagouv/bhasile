"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AdresseAdministrativeAndAntennes } from "@/app/components/forms/adresseAdministrativeAndAntenne/AdresseAdministrativeAndAntennes";
import { OperateurAutocompleteRhf } from "@/app/components/forms/autocomplete/OperateurAutocompleteRhf";
import { FieldSetContacts } from "@/app/components/forms/contacts/FieldSetContacts";
import { DnaAndFiness } from "@/app/components/forms/dnaAndFiness/DnaAndFiness";
import FormWrapper from "@/app/components/forms/FormWrapper";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import SelectWithValidation from "@/app/components/forms/SelectWithValidation";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import {
  AjoutIdentificationFormValues,
  ajoutIdentificationSchema,
} from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { ACCEPTED_STRUCTURE_TYPES,PublicType } from "@/types/structure.type";

export default function FormIdentification() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";
  const structureId = Number(params.id) || undefined;

  const previousRoute = "/ajout-structure/selection";
  const resetRoute = `/ajout-structure/${params.id}/01-identification`;
  const nextRoute = isEditMode
    ? `/ajout-structure/${params.id}/05-verification`
    : `/ajout-structure/${params.id}/02-adresses`;

  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.id}-identification`, {});

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
      {({ control }) => {
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectWithValidation
                  name="type"
                  control={control}
                  label="Type"
                  required
                  id="type"
                >
                  <option value="">Sélectionnez un type</option>
                  {ACCEPTED_STRUCTURE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </SelectWithValidation>

                <OperateurAutocompleteRhf />
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
            </fieldset>

            <hr />

            <AdresseAdministrativeAndAntennes />

            <hr />

            <DnaAndFiness entityId={{ structureId }} />

            <hr />

            <FieldSetContacts />
          </>
        );
      }}
    </FormWrapper>
  );
}
