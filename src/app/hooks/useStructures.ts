import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import { transformFormAdressesToApiAdresses } from "@/app/utils/adresse.util";
import { transformAgentFormContactsToApiContacts } from "@/app/utils/contacts.util";
import { formatDateToIsoString } from "@/app/utils/date.util";
import {
  StructureApiRead,
  StructureApiWrite,
} from "@/schemas/api/structure.schema";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { AjoutTypePlacesFormValues } from "@/schemas/forms/ajout/ajoutTypePlaces.schema";
import { TypeBatiAndAdressesFormValues } from "@/schemas/forms/base/adresse.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { DeepPartial } from "@/types/global";

import { parseFrenchNumber } from "../utils/number.util";

dayjs.extend(customParseFormat);

export const useStructures = (): UseStructureResult => {
  const addStructure = async (values: AjoutFormValues): Promise<string> => {
    const structure = await transformAjoutFormStructureToApiStructure(values);
    try {
      const response = await fetch("/api/structures", {
        method: "POST",
        body: JSON.stringify(structure),
      });
      if (response.status < 400) {
        return "OK";
      } else {
        const result = await response.json();
        return JSON.stringify(result);
      }
    } catch (error) {
      console.error(error);
      return String(error);
    }
  };

  const updateStructure = async (structure: unknown): Promise<string> => {
    try {
      const response = await fetch("/api/structures", {
        method: "PUT",
        body: JSON.stringify(structure),
      });
      if (response.status < 400) {
        return "OK";
      } else {
        const result = await response.json();
        return JSON.stringify(result);
      }
    } catch (error) {
      console.error(error);
      throw new Error(error?.toString());
    }
  };

  const updateAndRefreshStructure = async (
    structureId: number,
    structure: unknown,
    setStructure: (structure: StructureApiRead) => void
  ): Promise<string> => {
    const result = await updateStructure({
      ...(structure as object),
      id: structureId,
    });
    if (result === "OK") {
      const res = await fetch(`/api/structures/${structureId}`);
      const updatedStructure = await res.json();
      setStructure(updatedStructure);
    }
    return result;
  };

  return {
    addStructure,
    updateStructure,
    updateAndRefreshStructure,
  };
};

type UseStructureResult = {
  addStructure: (values: AjoutFormValues) => Promise<string>;
  updateStructure: (values: unknown) => Promise<string>;
  updateAndRefreshStructure: (
    structureId: number,
    values: unknown,
    setStructure: (structure: StructureApiRead) => void
  ) => Promise<string>;
};

export const transformAjoutFormStructureToApiStructure = async (
  values: AjoutFormValues
): Promise<DeepPartial<StructureApiWrite>> => {
  const adresses = transformFormAdressesToApiAdresses(
    values.adresses,
    values.id
  );

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
    debutConvention: formatDateToIsoString(values.debutConvention),
    finConvention: formatDateToIsoString(values.finConvention),
    creationDate: formatDateToIsoString(values.creationDate),
    date303: formatDateToIsoString(values.date303),
    lgbt: values.lgbt,
    fvvTeh: values.fvvTeh,
    public: values.public,
    debutPeriodeAutorisation: formatDateToIsoString(
      values.debutPeriodeAutorisation
    ),
    finPeriodeAutorisation: formatDateToIsoString(
      values.finPeriodeAutorisation
    ),
    adresses,
    antennes: values.antennes,
    dnaStructures: values.dnaStructures,
    finesses: values.finesses,
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
