"use client";

import { ReactElement, useState } from "react";

import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import { BHASILE_CONTACT_EMAIL, BHASILE_PHONE_NUMBERS } from "@/constants";

import { BackButton } from "./_components/BackButton";
import { ValidationButton } from "./_components/ValidationButton";

export default function AjoutStructurePage(): ReactElement {
  const [selectedStructureIds, setSelectedStructuresId] = useState<number[]>(
    []
  );

  return (
    <>
      <BackButton />
      <div className="max-w-5xl mx-auto mt-12">
        <h2 className="flex items-center gap-3 text-xl font-bold mb-8 text-title-blue-france justify-center">
          <span className="fr-icon-search-line fr-icon--md" />
          Quelle structure voulez-vous ajouter ?
        </h2>
        <StructureSearch
          selectedStructureIds={selectedStructureIds}
          setSelectedStructuresId={setSelectedStructuresId}
        />
        <p className="text-mention-grey text-sm text-center mb-10">
          Si vous ne trouvez pas votre structure,{" "}
          <a
            href={`mailto:${BHASILE_CONTACT_EMAIL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            contactez-nous par mail
          </a>{" "}
          ou par téléphone ({BHASILE_PHONE_NUMBERS})
        </p>
        <ValidationButton selectedStructureIds={selectedStructureIds} />
      </div>
    </>
  );
}
