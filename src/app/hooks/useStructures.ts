import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { transformAgentFormContactsToApiContacts } from "@/app/utils/contacts.util";
import { formatDateToIsoString } from "@/app/utils/date.util";
import {
  StructureApiRead,
  StructureApiWriteClient,
} from "@/schemas/api/structure.schema";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { AjoutTypePlacesFormValues } from "@/schemas/forms/ajout/ajoutTypePlaces.schema";
import { TypeBatiAndAdressesFormValues } from "@/schemas/forms/base/adresse.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { DeepPartial } from "@/types/global";

import { ApiError, extractApiError } from "../utils/apiError.util";
import { parseFrenchNumber } from "../utils/number.util";
import { refreshBestEffort } from "../utils/refresh.util";

dayjs.extend(customParseFormat);

export const useStructures = (): UseStructureResult => {
  const addStructure = async (values: AjoutFormValues): Promise<void> => {
    const structure = await transformAjoutFormStructureToApiStructure(values);
    const response = await fetch("/api/structures", {
      method: "POST",
      body: JSON.stringify(structure),
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
  };

  const updateStructure = async (structure: unknown): Promise<void> => {
    const id = (structure as { id?: number }).id;
    const response = await fetch(`/api/structures/${id}`, {
      method: "PUT",
      body: JSON.stringify(structure),
    });
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
  };

  const updateActualisation = async (
    structureId: number,
    structure: unknown,
    setStructure: (structure: StructureApiRead) => void
  ): Promise<void> => {
    const response = await fetch(
      `/api/structures/${structureId}/actualisation`,
      {
        method: "PUT",
        body: JSON.stringify({ ...(structure as object), id: structureId }),
      }
    );
    if (!response.ok) {
      throw new ApiError(await extractApiError(response), response.status);
    }
    await refreshBestEffort(`/api/structures/${structureId}`, setStructure);
  };

  const updateAndRefreshStructure = async (
    structureId: number,
    structure: unknown,
    setStructure: (structure: StructureApiRead) => void
  ): Promise<void> => {
    await updateStructure({ ...(structure as object), id: structureId });
    await refreshBestEffort(`/api/structures/${structureId}`, setStructure);
  };

  return {
    addStructure,
    updateStructure,
    updateAndRefreshStructure,
    updateActualisation,
  };
};

type UseStructureResult = {
  addStructure: (values: AjoutFormValues) => Promise<void>;
  updateStructure: (values: unknown) => Promise<void>;
  updateAndRefreshStructure: (
    structureId: number,
    values: unknown,
    setStructure: (structure: StructureApiRead) => void
  ) => Promise<void>;
  updateActualisation: (
    structureId: number,
    values: unknown,
    setStructure: (structure: StructureApiRead) => void
  ) => Promise<void>;
};

export const transformAjoutFormStructureToApiStructure = async (
  values: AjoutFormValues
): Promise<DeepPartial<StructureApiWriteClient>> => {
  return {
    id: values.id,
    codeBhasile: values.codeBhasile,
    operateur: values.operateur,
    filiale: values.filiale,
    type: values.type,
    adresseAdministrative: values.adresseAdministrative,
    codePostalAdministratif: values.codePostalAdministratif,
    communeAdministrative: values.communeAdministrative,
    departementAdministratif: values.departementAdministratif,
    nom: values.nom,
    creationDate: formatDateToIsoString(values.creationDate),
    date303: formatDateToIsoString(values.date303),
    public: values.public,
    adresses: values.adresses,
    antennes: values.antennes,
    dnaStructures: values.dnaStructures,
    structureFinesses: values.structureFinesses,
    contacts: transformAgentFormContactsToApiContacts(values.contacts),
    structureMillesimes:
      values.structureMillesimes?.map((millesime) => ({
        ...millesime,
        operateurComment: millesime.operateurComment ?? undefined,
      })) || undefined,
    structureTypologies: values.typologies?.map((typologie) => ({
      ...typologie,
      placesAutorisees: parseFrenchNumber(typologie.placesAutorisees) ?? 0,
      pmr: parseFrenchNumber(typologie.pmr) ?? 0,
      lgbt: parseFrenchNumber(typologie.lgbt) ?? 0,
      fvvTeh: parseFrenchNumber(typologie.fvvTeh) ?? 0,
    })),
    documentsFinanciers: values.documentsFinanciers,
  };
};

export type AjoutFormValues = Partial<
  AjoutIdentificationFormValues &
    TypeBatiAndAdressesFormValues &
    AjoutTypePlacesFormValues &
    DocumentsFinanciersFlexibleFormValues
>;
