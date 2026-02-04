"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CpomTable } from "@/app/components/forms/finance/budget-tables/CpomTable";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { PreviousPageLink } from "@/app/components/forms/PreviousPageLink";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpom } from "@/app/hooks/useCpom";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { CpomFormValues, cpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../../_context/CpomClientContext";

const confirmationModal = createModal({
  id: "confirmation-cpom-modal",
  isOpenedByDefault: false,
});

export default function CpomModificationFinance() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const isCreation = searchParams.get("isCreation") === "true";

  const { cpom, setCpom } = useCpomContext();

  const { updateCpom } = useCpom();

  const { getFetchState, setFetchState } = useFetchState();
  const saveState = getFetchState("cpom-save");

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  const handleSubmit = async (data: CpomFormValues) => {
    setFetchState("cpom-save", FetchState.LOADING);
    const result = await updateCpom(data, setCpom);
    if (typeof result === "object" && "cpomId" in result) {
      setFetchState("cpom-save", FetchState.IDLE);
      confirmationModal.open();
    } else {
      setFetchState("cpom-save", FetchState.ERROR);
      setBackendError(result);
      console.error(result);
    }
  };

  const defaultValues = getCpomDefaultValues(cpom);

  useEffect(() => {
    if (!cpom?.id || !isCreation) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      router.push(`/cpoms/${cpom?.id}/modification/01-identification`);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, cpom?.id, isCreation]);

  if (!cpom) {
    return null;
  }

  return (
    <>
      <Stepper
        currentStep={2}
        nextTitle=""
        stepCount={2}
        title="Analyse financière"
      />

      <FormWrapper
        schema={cpomSchema}
        defaultValues={defaultValues}
        submitButtonText="Terminer"
        onSubmit={handleSubmit}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <PreviousPageLink
          previousRoute={`/cpoms/${cpom.id}/modification/01-identification`}
        />
        <p>
          Veuillez renseigner l’historique des données budgétaires{" "}
          <strong>à l’échelle de l’ensemble du CPOM</strong>. Concernant les
          affectations, ce tableau reflète le flux annuel et ne constitue en
          aucun cas un calcul ou du stock.
        </p>
        <CpomTable />
        {saveState === FetchState.ERROR && (
          <SubmitError
            structureDnaCode={String(cpom.id)}
            backendError={backendError}
          />
        )}
      </FormWrapper>
      <confirmationModal.Component
        title={
          isCreation
            ? "Vous avez créé un CPOM !"
            : "Vous avez modifié un CPOM !"
        }
        buttons={[
          {
            doClosesModal: true,
            children: "J’ai compris",
            type: "button",
            onClick: () => {
              router.push(`/structures`);
            },
          },
        ]}
      >
        <p>
          Les données ont bien été enregistrées. vous pourrez les retrouver au
          sein des pages structures concernées par ce CPOM.
        </p>
      </confirmationModal.Component>
    </>
  );
}
