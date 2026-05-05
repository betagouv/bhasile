"use client";

import { ReactElement, useState } from "react";

import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import { BHASILE_CONTACT_EMAIL, BHASILE_PHONE_NUMBERS } from "@/constants";

import { ValidationButton } from "./_components/ValidationButton";

export default function AjoutAdressesPage(): ReactElement {
  const [selectedStructuresId, setSelectedStructuresId] = useState<number[]>(
    []
  );
  return (
    <div className="max-w-5xl mx-auto mt-12">
      <h2 className="flex items-center gap-3 text-xl font-bold mb-8 text-title-blue-france justify-center">
        <span className="fr-icon-search-line fr-icon--md" />
        Sélectionnez votre structure
      </h2>
      <StructureSearch
        selectedStructuresId={selectedStructuresId}
        setSelectedStructuresId={setSelectedStructuresId}
      />
      <p className="text-mention-grey text-sm text-center mb-10">
        Si vous ne trouvez pas votre structure,{" "}
        <a href={`mailto:${BHASILE_CONTACT_EMAIL}`} className="underline">
          contactez-nous par mail
        </a>{" "}
        ou par téléphone ({BHASILE_PHONE_NUMBERS})
      </p>
      <ValidationButton selectedStructuresId={selectedStructuresId} />
    </div>
  );
}
