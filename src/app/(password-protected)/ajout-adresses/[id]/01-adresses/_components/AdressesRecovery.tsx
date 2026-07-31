"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { FieldSetTypeBati } from "@/app/components/forms/hebergement/FieldSetTypeBati";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { useStructures } from "@/app/hooks/useStructures";
import { migrateLegacyAdresseTypologies } from "@/app/utils/adresse.util";
import { ApiError } from "@/app/utils/apiError.util";
import { getErrorEmail } from "@/app/utils/errorMail.util";
import {
  TypeBatiAndAdressesFormValues,
  typeBatiAndAdressesSchema,
} from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import { AdressesRecoveryModal } from "./AdressesRecoveryModal";

export const AdressesRecovery = ({ id }: { id: number }) => {
  const [state, setState] = useState<"idle" | "error">("idle");
  const [backendError, setBackendError] = useState("");

  const router = useRouter();
  const { updateStructure } = useStructures();
  const { currentValue: localStorageValues } = useLocalStorage(
    `ajout-structure-${id}-adresses`,
    {} as TypeBatiAndAdressesFormValues
  );

  const formattedLocalStorageValues = useMemo(() => {
    return localStorageValues && Object.keys(localStorageValues).length > 0
      ? {
          typeBati: localStorageValues.typeBati,
          adresses: migrateLegacyAdresseTypologies(localStorageValues.adresses),
        }
      : {
          typeBati: undefined,
          adresses: [
            {
              adresseComplete: "",
              adresse: "",
              codePostal: "",
              commune: "",
              departement: "",
              repartition: Repartition.DIFFUS,
              placesAutorisees: undefined as unknown as number,
              isLogementSocial: false,
              isQpv: false,
            },
          ],
        };
  }, [localStorageValues]);

  const adressesRecoveredNumber = useMemo(() => {
    return localStorageValues?.adresses?.length ?? 0;
  }, [localStorageValues]);

  const handleSubmit = async (data: TypeBatiAndAdressesFormValues) => {
    try {
      await updateStructure({
        id,
        adresses: data.adresses,
        typeBati: data.typeBati,
      });
      router.push(`/ajout-adresses/${id}/02-confirmation`);
    } catch (error) {
      setBackendError(
        error instanceof ApiError ? error.message : "Une erreur est survenue."
      );
      setState("error");
    }
  };

  // Needed to avoid hydration error
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) {
    return null;
  }

  return (
    <>
      <FormWrapper
        schema={typeBatiAndAdressesSchema}
        defaultValues={formattedLocalStorageValues}
        onSubmit={handleSubmit}
        mode="onChange"
        resetRoute={`/ajout-adresses/${id}/01-adresses`}
        submitButtonText="Valider"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <FieldSetTypeBati />
        <FieldSetHebergement formKind={FormKind.ADRESSES_RECOVERY} />
      </FormWrapper>
      {state === "error" && (
        <div className="flex items-end flex-col">
          <p className="text-default-error m-0">
            Une erreur s’est produite.{" "}
            <a href={getErrorEmail(backendError, id)} className="underline">
              Nous prévenir
            </a>
          </p>
        </div>
      )}
      <AdressesRecoveryModal
        adressesRecoveredNumber={adressesRecoveredNumber}
      />
    </>
  );
};
