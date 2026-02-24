"use client";
import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { useRedirectStructureCreation } from "@/app/hooks/useRedirectStructureCreation";
import { useStructures } from "@/app/hooks/useStructures";
import { getErrorEmail } from "@/app/utils/errorMail.util";
import { BHASILE_CONTACT_EMAIL } from "@/constants";
import { AjoutAdressesFormValues } from "@/schemas/forms/ajout/ajoutAdresses.schema";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { AjoutTypePlacesFormValues } from "@/schemas/forms/ajout/ajoutTypePlaces.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

import { Adresses } from "./components/Adresses";
import { DocumentsFinanciers } from "./components/DocumentsFinanciers";
import { Identification } from "./components/Identification";
import { StepResume } from "./components/StepResume";
import { TypePlaces } from "./components/TypePlaces";

export default function StepVerification() {
  useRedirectStructureCreation();

  const { addStructure } = useStructures();
  const router = useRouter();
  const params = useParams();
  const previousRoute = `/ajout-structure/${params.dnaCode}/04-documents`;
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [backendError, setBackendError] = useState("");

  const {
    currentValue: identificationValues,
    resetLocalStorageValues: resetIdentification,
  } = useLocalStorage<Partial<AjoutIdentificationFormValues>>(
    `ajout-structure-${params.dnaCode}-identification`,
    {}
  );

  const {
    currentValue: adressesValues,
    resetLocalStorageValues: resetAdresses,
  } = useLocalStorage<Partial<AjoutAdressesFormValues>>(
    `ajout-structure-${params.dnaCode}-adresses`,
    {}
  );

  const {
    currentValue: typePlacesValues,
    resetLocalStorageValues: resetTypePlaces,
  } = useLocalStorage<Partial<AjoutTypePlacesFormValues>>(
    `ajout-structure-${params.dnaCode}-type-places`,
    {}
  );

  const {
    currentValue: documentsFinanciersValues,
    resetLocalStorageValues: resetDocuments,
  } = useLocalStorage<Partial<DocumentsFinanciersFlexibleFormValues>>(
    `ajout-structure-${params.dnaCode}-documents`,
    {}
  );

  const handleSubmit = async () => {
    setState("loading");
    const allValues = {
      ...identificationValues,
      ...adressesValues,
      ...typePlacesValues,
      ...documentsFinanciersValues,
    };

    const result = await addStructure(allValues);

    if (result === "OK") {
      router.push(`/ajout-structure/${params.dnaCode}/06-confirmation`);
    } else {
      setBackendError(result);
      setState("error");
    }
  };

  const handleCancel = () => {
    const confirmReset = window.confirm(
      "Attention : Toutes les données saisies vont être effacées. Êtes-vous sûr·e de vouloir continuer ?"
    );

    if (confirmReset) {
      resetIdentification();
      resetAdresses();
      resetTypePlaces();
      resetDocuments();

      router.push(`/ajout-structure/${params.dnaCode}/01-identification`);
      window.location.reload();
    }
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  // TODO : Refacto ce composant pour isoler la logique du localStorage et éviter les problèmes de réhydratation
  if (!isClient) {
    return null;
  }

  return (
    <>
      <div>
        <h1 className=" text-title-blue-france text-xl mb-0 flex gap-2">
          <i className="ri-list-check-3 before:w-4"></i>
          Vérification des données
        </h1>
        <p>
          Veuillez vérifier que l’ensemble des données saisies sont correctes
        </p>
      </div>
      <div className="bg-white p-6 rounded-lg border border-default-grey">
        <Link
          href={previousRoute}
          className="fr-link fr-icon border-b w-fit pb-px hover:pb-0 hover:border-b-2 mb-8 block"
        >
          <i className="fr-icon-arrow-left-s-line before:w-4"></i>
          Revenir au formulaire
        </Link>
        <Notice
          severity="info"
          title=""
          className="rounded [&_p]:flex [&_p]:items-center"
          description="Veuillez vérifier les informations saisies méticuleusement : une fois validées, il ne sera plus possible de les modifier."
        />
        <StepResume
          className="mt-10"
          title="Identification de la structure"
          link={`/ajout-structure/${params.dnaCode}/01-identification?mode=edit`}
        >
          <Identification />
        </StepResume>
        <StepResume
          title="Adresses"
          link={`/ajout-structure/${params.dnaCode}/02-adresses?mode=edit`}
        >
          <Adresses />
        </StepResume>
        <StepResume
          title="Types de places"
          link={`/ajout-structure/${params.dnaCode}/03-type-places?mode=edit`}
        >
          <TypePlaces />
        </StepResume>
        <StepResume
          title="Documents financiers"
          link={`/ajout-structure/${params.dnaCode}/04-documents?mode=edit`}
          canEdit={false}
        >
          <DocumentsFinanciers />
        </StepResume>
        {state === "error" && (
          <div className="flex items-end flex-col">
            <p className="text-default-error m-0">
              Une erreur s’est produite. Vos données restent sauvegardées dans
              le navigateur.
            </p>
            <p className="text-default-error">
              <a
                href={getErrorEmail(backendError, params.dnaCode as string)}
                className="underline"
                target="_blank"
              >
                Nous prévenir
              </a>
            </p>
          </div>
        )}
        <div>
          <div className="flex justify-end gap-4 mt-6">
            <Button priority="secondary" onClick={handleCancel}>
              Annuler
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={state === "loading"}
            >
              {state === "loading"
                ? "Enregistrement en cours..."
                : "Valider et terminer"}
            </Button>
          </div>
          <p className="cta_message text-mention-grey text-sm text-right mt-2">
            Si vous ne parvenez pas à remplir certains champs,{" "}
            <a
              href={`mailto:${BHASILE_CONTACT_EMAIL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              contactez-nous
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
