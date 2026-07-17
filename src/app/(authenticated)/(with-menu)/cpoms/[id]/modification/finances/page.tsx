"use client";

import { useState } from "react";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { SegmentedControl } from "@/app/components/common/SegmentedControl";
import { CpomDocumentsFinanciers } from "@/app/components/forms/cpom/CpomDocumentsFinanciers";
import { CpomTable } from "@/app/components/forms/finance/budget-tables/CpomTable";
import FormWrapper, {
  FooterButtonType,
} from "@/app/components/forms/FormWrapper";
import { LeaveModificationModal } from "@/app/components/forms/LeaveModificationModal";
import { ModificationTitle } from "@/app/components/forms/ModificationTitle";
import { useCpomFormHandling } from "@/app/hooks/useCpomFormHandling";
import {
  getCpomDefaultValues,
  getCpomStructureTypes,
} from "@/app/utils/cpom.util";
import { financesAndDocumentsCpomSchema } from "@/schemas/forms/base/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { useCpomContext } from "../../_context/CpomClientContext";

export default function CpomModificationFinance() {
  const { cpom } = useCpomContext();

  const { handleSubmit } = useCpomFormHandling({
    cpomId: cpom.id,
    nextRoute: `/cpoms/${cpom.id}`,
  });
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  const defaultValues = getCpomDefaultValues(cpom);
  const structureTypes = getCpomStructureTypes(cpom);

  const [currentType, setCurrentType] = useState<StructureType | undefined>(
    structureTypes[0]
  );

  if (!currentType) {
    return null;
  }

  return (
    <>
      <ModificationTitle
        step="Finances"
        handleCancel={() => setShouldOpenModal(true)}
      />
      <FormWrapper
        schema={financesAndDocumentsCpomSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitButtonText="Valider"
        handleCancel={() => setShouldOpenModal(true)}
        availableFooterButtons={[
          FooterButtonType.CANCEL,
          FooterButtonType.SUBMIT,
        ]}
        className="border-2 border-solid border-(--text-title-blue-france) gap-10"
      >
        {structureTypes.length > 1 && (
          <CustomNotice
            severity="info"
            description="Nous avons détecté dans la composition de votre CPOM différents types de structures. Veuillez remplir les informations pour chacun d’eux via le sélecteur ci-dessous, en prenant en compte toutes les structures du type correspondant."
          />
        )}

        {structureTypes.length > 1 && (
          <SegmentedControl
            name="cpomFinancesType"
            className="mb-2"
            options={structureTypes.map((structureType) => ({
              id: structureType,
              label: structureType,
              value: structureType,
              isChecked: currentType === structureType,
            }))}
            onChange={(value) => setCurrentType(value as StructureType)}
          />
        )}

        <p className="mb-0 max-w-3xl">
          Veuillez renseigner l’historique des données budgétaires{" "}
          <strong>à l’échelle de l’ensemble du CPOM</strong>. Aussi, le tableau
          des affectations reflète uniquement des flux annuels. Les montants
          saisis ne doivent en aucun cas être une estimation du stock.
        </p>

        <CpomTable type={currentType} showTitle />
        <hr />
        <div>
          <h2 className="text-title-blue-france text-xl mb-6">
            Documents financiers ({currentType})
          </h2>
          <CpomDocumentsFinanciers structureType={currentType} />
        </div>
      </FormWrapper>
      <LeaveModificationModal
        resetRoute={`/cpoms/${cpom.id}`}
        shouldOpen={shouldOpenModal}
        setShouldOpen={setShouldOpenModal}
      />
    </>
  );
}
