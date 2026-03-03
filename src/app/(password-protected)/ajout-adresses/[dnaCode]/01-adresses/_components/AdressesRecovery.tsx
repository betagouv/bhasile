"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { FieldSetHebergement } from "@/app/components/forms/hebergement/FieldSetHebergement";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { useStructures } from "@/app/hooks/useStructures";
import { transformFormAdressesToApiAdresses } from "@/app/utils/adresse.util";
import { getYearFromDate } from "@/app/utils/date.util";
import { getErrorEmail } from "@/app/utils/errorMail.util";
import { CURRENT_YEAR } from "@/constants";
import {
  FormAdresse,
  FormAdresseTypologie,
} from "@/schemas/forms/base/adresse.schema";
import {
  RecoveryAdressesFormValues,
  recoveryAdressesSchema,
} from "@/schemas/forms/recovery-adresses/recoveryAdresses.schema";
import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import { AdressesRecoveryModal } from "./AdressesRecoveryModal";
import { AdressesRecoveryTypeBati } from "./AdressesRecoveryTypeBati";

export const AdressesRecovery = ({ dnaCode }: { dnaCode: string }) => {
  const [state, setState] = useState<"idle" | "error">("idle");
  const [backendError, setBackendError] = useState("");

  const router = useRouter();
  const { updateStructure } = useStructures();
  const { currentValue: localStorageValues } = useLocalStorage(
    `ajout-structure-${dnaCode}-adresses`,
    {} as RecoveryAdressesFormValues
  );

  const formattedLocalStorageValues = useMemo(() => {
    return localStorageValues && Object.keys(localStorageValues).length > 0
      ? {
          typeBati: localStorageValues.typeBati,
          adresses: localStorageValues.adresses?.map(
            (adresse: FormAdresse) => ({
              ...adresse,
              adresseTypologies: adresse.adresseTypologies?.map(
                (typologie: FormAdresseTypologie) => {
                  const typedTypologie = typologie as FormAdresseTypologie & {
                    date: string;
                  };
                  return {
                    ...typologie,
                    year:
                      typedTypologie.year ??
                      getYearFromDate(typedTypologie.date),
                  };
                }
              ),
            })
          ),
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
              adresseTypologies: [
                {
                  year: CURRENT_YEAR,
                  placesAutorisees: undefined as unknown as number,
                  logementSocial: false,
                  qpv: false,
                },
              ],
            },
          ],
        };
  }, [localStorageValues]);

  const adressesRecoveredNumber = useMemo(() => {
    return localStorageValues?.adresses?.length ?? 0;
  }, [localStorageValues]);

  const handleSubmit = async (data: RecoveryAdressesFormValues) => {
    const result = await updateStructure({
      dnaCode,
      adresses: transformFormAdressesToApiAdresses(data.adresses, dnaCode),
      typeBati: data.typeBati,
    });

    if (result === "OK") {
      router.push(`/ajout-adresses/${dnaCode}/02-confirmation`);
    } else {
      setBackendError(result);
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
        schema={recoveryAdressesSchema}
        defaultValues={formattedLocalStorageValues}
        onSubmit={handleSubmit}
        mode="onChange"
        resetRoute={`/ajout-adresses/${dnaCode}/01-adresses`}
        submitButtonText="Valider"
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <AdressesRecoveryTypeBati />
        <FieldSetHebergement formKind={FormKind.ADRESSES_RECOVERY} />
      </FormWrapper>
      {state === "error" && (
        <div className="flex items-end flex-col">
          <p className="text-default-error m-0">
            Une erreur s’est produite.{" "}
            <a
              href={getErrorEmail(backendError, dnaCode)}
              className="underline"
            >
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
