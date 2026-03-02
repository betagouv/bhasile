import Link from "next/link";
import { ReactElement, useState } from "react";
import { useFormContext } from "react-hook-form";

import { useSpreadsheetParse } from "@/app/hooks/useSpreadsheetParse";
import {
  MODELE_DIFFUS_LINK,
  MODELE_MIXTE_LINK,
  SPREADSHEET_MIME_TYPES,
} from "@/constants";
import { Repartition } from "@/types/adresse.type";

export const AdressImporter = ({ typeBati }: Props): ReactElement => {
  const { setValue, getValues } = useFormContext();
  const [parsingError, setParsingError] = useState("");
  const { parseAdressesDiffuses, parseAdressesMixtes } = useSpreadsheetParse();

  const onAdressesUpload = async (typeBati: Repartition): Promise<void> => {
    const input = document.getElementById("adresses-upload");
    const file = (input as HTMLInputElement).files?.[0];
    if (file) {
      const parseFunction =
        typeBati === Repartition.DIFFUS
          ? parseAdressesDiffuses
          : parseAdressesMixtes;
      try {
        const newAdresses = await parseFunction(file);
        const currentAddresses = getValues("adresses") || [];
        if (
          currentAddresses.length === 1 &&
          currentAddresses[0].adresse === ""
        ) {
          const updatedAddresses = [...newAdresses];
          setValue("adresses", updatedAddresses, {
            shouldValidate: false,
          });
        } else {
          const updatedAddresses = [...currentAddresses, ...newAdresses];
          setValue("adresses", updatedAddresses, {
            shouldValidate: false,
          });
        }
        setParsingError("");
      } catch (error) {
        const sanitizedError = (error as string)
          .toString()
          .replaceAll("Error: ", "");
        setParsingError(sanitizedError);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-alt-blue-france p-4 rounded min-h-16">
      <input
        type="file"
        id="adresses-upload"
        accept={SPREADSHEET_MIME_TYPES.join(",")}
        className="file:bg-white file:p-2 file:rounded file:mr-2 file:cursor-pointer"
        onChange={() => onAdressesUpload(typeBati)}
      />
      {parsingError && (
        <div className="text-red-500 pt-2">
          <i>L’import du tableur n’a pas fonctionné.</i>
          <br />
          Il se peut que vous n’ayez pas respecté tous les pré-requis. Vérifiez
          les conditions ci-dessous :
          <ul>
            <li>
              Avez-vous bien utilisé{" "}
              <Link
                href={
                  typeBati === Repartition.DIFFUS
                    ? MODELE_DIFFUS_LINK
                    : MODELE_MIXTE_LINK
                }
                className="underline"
              >
                le tableur pré-formaté disponible au téléchargement
              </Link>{" "}
              et non un tableur créé par vous-même ?
            </li>
            <li>
              Avez-vous bien saisi les adresses postales en enlevant toutes
              autres indications (ex : numéro d’appartement) ?
            </li>
            <li>
              Pour le nombre de places autorisées, avez-vous bien renseigné un
              nombre différent de 0 ?
            </li>
            <li>
              Dans la colonne “Logement social”, avez-vous bien indiqué “Oui” si
              le logement est loué à un bailleur social et “Non” le cas échéant
              ?
            </li>
            <li>
              Dans la colonne “QPV”, après avoir vérifié si l’adresse en
              question faisait partie d’un Quartier Prioritaire de la Ville sur
              <Link
                href="https://sig.ville.gouv.fr/"
                className="underline"
                target="_blank"
                rel="noopener external"
              >
                ce lien
              </Link>{" "}
              avez-vous bien indiqué “Oui” si c’était le cas et “Non” le cas
              échéant ou si vous n’obtenez pas de réponse ?
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

type Props = {
  typeBati: Repartition;
};
