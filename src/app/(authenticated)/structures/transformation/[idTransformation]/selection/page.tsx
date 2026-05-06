"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { TransformationTypeForms } from "@/app/components/forms/transformation-types/TransformationTypeForms";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

export default function TransformationSelectionsPage() {
  const { idTransformation } = useParams();

  const { transformation } = useFetchTransformation(Number(idTransformation));

  if (!transformation) {
    return null;
  }

  const formType = getFormByType(transformation.type);

  return (
    <TransformationTypeForms
      formType={formType}
      structureId={transformation.structureTransformations?.[0]?.structureId}
      initialTransformationType={transformation.type}
      initialStructureTransformations={transformation.structureTransformations}
    />
  );
}

const getFormByType = (
  type?: TransformationType
): "creation" | "huda" | undefined => {
  switch (type) {
    case TransformationType.OUVERTURE_EX_NIHILO:
    case TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES:
      return "creation";
    case TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR:
    case TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR:
    case TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES:
      return "huda";
    case TransformationType.EXTENSION_EX_NIHILO:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT:
    case TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT:
    case TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE:
    case TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES:
    case TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES:
    case TransformationType.FERMETURE_SANS_TRANSFERT:
    default:
      return undefined;
  }
};

// Temp hooks, waiting for PR 1232
const useFetchTransformation = (id?: number) => {
  const [transformation, setTransformation] = useState<
    TransformationApiRead | undefined
  >(undefined);

  const getTransformation = async (
    id: number
  ): Promise<TransformationApiRead | undefined> => {
    try {
      return {
        id,
        type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
        structureTransformations: [],
      };
    } catch (error) {
      console.error("Error fetching transformation:", error);
      return undefined;
    }
  };

  useEffect(() => {
    const fetchTransformation = async (id: number) => {
      setTransformation(undefined);
      const transformation = await getTransformation(id);
      setTransformation(transformation);
    };

    if (id) {
      fetchTransformation(id);
    }
  }, [id]);

  return {
    transformation,
  };
};
