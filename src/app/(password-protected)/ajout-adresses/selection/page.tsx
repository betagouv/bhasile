"use client";

import { ReactElement } from "react";

import FormWrapper from "@/app/components/forms/FormWrapper";
import { StructureSearch } from "@/app/components/structure-selection/StructureSearch";
import { ajoutStructureSchema } from "@/schemas/forms/ajout/ajoutStructure.schema";

import { ValidationButton } from "./_components/ValidationButton";

export default function AjoutAdressesPage(): ReactElement {
  const BHASILE_CONTACT_EMAIL =
    process.env.NEXT_PUBLIC_BHASILE_CONTACT_EMAIL || "";
  const BHASILE_PHONE_NUMBERS =
    process.env.NEXT_PUBLIC_BHASILE_PHONE_NUMBERS || "";

  return (
    <FormWrapper
      schema={ajoutStructureSchema}
      availableFooterButtons={[]}
      className="bg-transparent border-none p-0"
      showContactInfos={false}
    >
      <div className="max-w-5xl mx-auto mt-12">
        <h2 className="flex items-center gap-3 text-xl font-bold mb-8 text-title-blue-france justify-center">
          <span className="fr-icon-search-line fr-icon--md" />
          Sélectionnez votre structure
        </h2>
        <StructureSearch />
        <p className="text-mention-grey text-sm text-center mb-10">
          Si vous ne trouvez pas votre structure,{" "}
          <a href={`mailto:${BHASILE_CONTACT_EMAIL}`} className="underline">
            contactez-nous par mail
          </a>{" "}
          ou par téléphone ({BHASILE_PHONE_NUMBERS})
        </p>
        <ValidationButton />
      </div>
    </FormWrapper>
  );
}
