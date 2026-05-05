import Button from "@codegouvfr/react-dsfr/Button";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { useFetchStructure } from "@/app/hooks/useFetchStructure";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { AjoutTypePlacesFormValues } from "@/schemas/forms/ajout/ajoutTypePlaces.schema";
import { TypeBatiAndAdressesFormValues } from "@/schemas/forms/base/adresse.schema";
import {
  FormAdresse,
  FormAdresseTypologie,
} from "@/schemas/forms/base/adresse.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { StructureTypologieWithoutEvolutionSchemaTypeFormValues } from "@/schemas/forms/base/structureTypologie.schema";

export const ValidationButtonWithHook = ({
  structuresId,
}: Props): ReactElement => {
  const router = useRouter();

  const { structure } = useFetchStructure(structuresId);

  const {
    updateLocalStorageValue: updateIdentification,
    currentValue: localIdentificationValue,
  } = useLocalStorage(`ajout-structure-${structuresId}-identification`, {});

  const {
    updateLocalStorageValue: updateAdresses,
    currentValue: localAdressesValue,
  } = useLocalStorage(
    `ajout-structure-${structuresId}-adresses`,
    {} as Partial<TypeBatiAndAdressesFormValues>
  );

  const {
    updateLocalStorageValue: updateTypePlaces,
    currentValue: localTypePlacesValue,
  } = useLocalStorage(
    `ajout-structure-${structuresId}-type-places`,
    {} as Partial<AjoutTypePlacesFormValues>
  );

  const {
    updateLocalStorageValue: updateDocuments,
    currentValue: localDocumentsValue,
  } = useLocalStorage(
    `ajout-structure-${structuresId}-documents`,
    {} as Partial<DocumentsFinanciersFlexibleFormValues>
  );

  const handleValidation = () => {
    updateIdentification({
      ...localIdentificationValue,
      id: structuresId,
      nom: structure?.nom,
      codeBhasile: structure?.codeBhasile,
      operateur: structure?.operateur,
      type: structure?.type,
      dnaStructures: structure?.dnaStructures,
      isMultiDna:
        structure?.dnaStructures && structure?.dnaStructures?.length > 1,
    });

    updateAdresses({
      ...localAdressesValue,
      adresses: localAdressesValue?.adresses?.map((adresse: FormAdresse) => ({
        ...adresse,
        adresseTypologies: adresse.adresseTypologies?.map(
          (typologie: FormAdresseTypologie) => {
            const typedTypologie = typologie as FormAdresseTypologie & {
              date: string;
            };
            return {
              ...typologie,
              year: typedTypologie.year ?? getYearFromDate(typedTypologie.date),
            };
          }
        ),
      })),
    });

    updateTypePlaces({
      ...localTypePlacesValue,
      typologies: localTypePlacesValue?.typologies?.map(
        (typologie: StructureTypologieWithoutEvolutionSchemaTypeFormValues) => {
          const typedTypologie =
            typologie as StructureTypologieWithoutEvolutionSchemaTypeFormValues & {
              date: string;
            };
          return {
            ...typedTypologie,
            year: typedTypologie.year ?? getYearFromDate(typedTypologie.date),
          };
        }
      ),
    });

    const { years } = getYearRange();
    const filteredStructureMillesimes = structure?.structureMillesimes?.filter(
      (millesime: StructureMillesimeApiType) => years.includes(millesime.year)
    );

    const structureMillesimes: StructureMillesimeApiType[] = years.map(
      (year: number) => {
        const referenceMillesime =
          localDocumentsValue?.structureMillesimes?.find(
            (millesime: StructureMillesimeApiType) => {
              const typedMillesime = millesime as StructureMillesimeApiType & {
                date: string;
              };
              return (
                (typedMillesime.year ??
                  getYearFromDate(typedMillesime.date)) === year
              );
            }
          ) ??
          filteredStructureMillesimes?.find(
            (millesime: StructureMillesimeApiType) => millesime.year === year
          );
        return {
          year: year,
          cpom: referenceMillesime?.cpom ?? false,
          operateurComment: referenceMillesime?.operateurComment ?? undefined,
        };
      }
    );

    updateDocuments({
      ...localDocumentsValue,
      structureMillesimes: structureMillesimes,
    });
    router.push(`/ajout-structure/${structuresId}/01-identification`);
  };

  return (
    <div className="flex justify-center">
      <Button
        type="button"
        onClick={handleValidation}
        disabled={!structure}
        className="flex gap-2"
      >
        J’ai trouvé ma structure{" "}
        <span className="fr-icon-arrow-right-line fr-icon--md" />
      </Button>
    </div>
  );
};

type Props = {
  structuresId: number;
};
