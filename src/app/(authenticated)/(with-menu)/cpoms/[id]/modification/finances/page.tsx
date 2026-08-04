"use client";

import { useState } from "react";

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
        step="Finance"
        titleAside={
          structureTypes.length > 1 ? (
            <SegmentedControl
              name="cpomFinancesType"
              options={structureTypes.map((structureType) => ({
                id: structureType,
                label: structureType,
                value: structureType,
                isChecked: currentType === structureType,
              }))}
              onChange={(value) => setCurrentType(value as StructureType)}
            />
          ) : undefined
        }
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
        <div>
          <h2
            className="text-title-blue-france text-lg mb-6 font-bold"
            id={`gestionBudgetaire-${currentType}`}
          >
            Gestion budgétaire ({currentType})
          </h2>
          <p className="mb-8 max-w-3xl">
            Veuillez renseigner l’historique des données budgétaires{" "}
            <strong>
              à l’échelle du CPOM en prenant en compte toutes les structures
              d’un même type.
            </strong>{" "}
            Aussi, le tableau des affectations reflète uniquement des flux
            annuels. Les montants saisis ne doivent en aucun cas être une
            estimation du stock.
          </p>
          <CpomTable
            type={currentType}
            ariaLabelledBy={`gestionBudgetaire-${currentType}`}
          />
        </div>
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
