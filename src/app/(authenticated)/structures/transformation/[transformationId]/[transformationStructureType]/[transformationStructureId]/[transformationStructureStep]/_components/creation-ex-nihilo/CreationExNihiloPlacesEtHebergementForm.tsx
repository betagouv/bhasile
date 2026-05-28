"use client";

import { notFound, useParams } from "next/navigation";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { FieldSetCurrentYearPlaces } from "@/app/components/forms/typePlace/FieldSetCurrentYearPlaces";
import { useTransformationFormHandling } from "@/app/hooks/useTransformationFormHandling";
import { getTransformationStructureVersionDefaultValues } from "@/app/utils/transformation.util";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import {
  CreationPlacesEtHebergementFormValues,
  creationPlacesEtHebergementSchema,
} from "@/schemas/forms/transformation/creationPlacesEtHebergement.schema";
import { FormKind } from "@/types/global";

/**
 * TODO: DELETE WHEN WE DELETE STRUCTURETYPOLOGIES
 */
const toApiAdresses = (adresses: FormAdresse[] | undefined): AdresseApiType[] =>
  (adresses ?? []).map((adresse) => ({
    id: adresse.id,
    structureId: adresse.structureId,
    adresse: adresse.adresse,
    codePostal: adresse.codePostal,
    commune: adresse.commune,
    repartition: adresse.repartition,
    adresseTypologies:
      adresse.adresseTypologies?.map((typologie) => ({
        ...typologie,
        placesAutorisees: Number(typologie.placesAutorisees),
        logementSocial: typologie.logementSocial
          ? Number(typologie.placesAutorisees)
          : 0,
        qpv: typologie.qpv ? Number(typologie.placesAutorisees) : 0,
      })) ?? [],
  }));

type Props = {
  transformation: TransformationApiRead;
};

export const CreationExNihiloPlacesEtHebergementForm = ({
  transformation,
}: Props) => {
  const { transformationStructureId } = useParams();
  const structureTransformation = transformation.structureTransformations.find(
    (st) => st.id === Number(transformationStructureId)
  );

  if (!structureTransformation) {
    notFound();
  }

  const { handleValidation } = useTransformationFormHandling();

  const defaultValues =
    getTransformationStructureVersionDefaultValues<CreationPlacesEtHebergementFormValues>(
      structureTransformation.structureVersion
    );

  return (
    <FormWrapper
      schema={creationPlacesEtHebergementSchema}
      defaultValues={defaultValues}
      onSubmit={(data) => {
        handleValidation({
          transformationId: transformation.id,
          structureTransformation: {
            id: structureTransformation.id,
            type: structureTransformation.type,
            structureVersion: {
              id: structureTransformation.structureVersion?.id,
              adresses: toApiAdresses(data.adresses),
              structureTypologies: data.structureTypologies,
            },
          },
        });
      }}
      submitButtonText="Étape suivante"
      availableFooterButtons={[FooterButtonType.SUBMIT]}
      showContactInfos={false}
    >
      <FieldSetCurrentYearPlaces />

      <hr />

      <FieldSetTypeBati />

      <FieldSetHebergement formKind={FormKind.CREATION_EX_NIHILO} />
    </FormWrapper>
  );
};
