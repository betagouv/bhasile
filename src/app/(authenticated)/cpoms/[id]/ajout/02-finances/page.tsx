"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CpomTable } from "@/app/components/forms/finance/budget-tables/CpomTable";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { PreviousPageLink } from "@/app/components/forms/PreviousPageLink";
import { SubmitError } from "@/app/components/SubmitError";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import { getCpomDefaultValues } from "@/app/utils/cpom.util";
import { financesCpomSchema } from "@/schemas/forms/base/cpom.schema";
import { FetchState } from "@/types/fetch-state.type";

import { useCpomContext } from "../../_context/CpomClientContext";

const confirmationModal = createModal({
  id: "confirmation-cpom-modal",
  isOpenedByDefault: false,
});

export default function CpomModificationFinance() {
  const router = useRouter();

  const { cpom } = useCpomContext();

  const { getFetchState } = useFetchState();
  const saveState = getFetchState("cpom-save");

  const { handleSubmit, backendError } = useCpomFormHandling({
    cpomId: cpom.id,
    callBack: () => {
      confirmationModal.open();
    },
  });

  const defaultValues = getCpomDefaultValues(cpom);

  useEffect(() => {
    if (!cpom?.id) {
      return;
    }

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      router.push(`/cpoms/${cpom?.id}/ajout/01-identification`);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, cpom?.id]);

  useIsModalOpen(confirmationModal, {
    onConceal: () => router.push(`/structures`),
  });

  return (
    <>
      <Stepper
        currentStep={2}
        nextTitle=""
        stepCount={2}
        title="Analyse financière"
        className="w-1/2"
      />

      <FormWrapper
        schema={financesCpomSchema}
        defaultValues={defaultValues}
        submitButtonText="Terminer"
        onSubmit={handleSubmit}
        availableFooterButtons={[FooterButtonType.SUBMIT]}
      >
        <PreviousPageLink
          previousRoute={`/cpoms/${cpom.id}/ajout/01-identification`}
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
        title="Vous avez créé un CPOM !"
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
          Les données ont bien été enregistrées. Vous pourrez les retrouver au
          sein des pages structures concernées par ce CPOM.
        </p>
      </confirmationModal.Component>
    </>
  );
}
