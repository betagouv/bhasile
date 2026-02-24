"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/app/components/common/Badge";
import { BHASILE_CONTACT_EMAIL } from "@/constants";

export default function ExisteDeja() {
  const searchParams = useSearchParams();
  const dnaCode = searchParams.get("dnaCode");

  return (
    <div className="max-w-xl mx-auto mt-auto h-[calc(60vh-12rem)] text-center flex flex-col items-center justify-center animate-fade-in border bg-white shadow-md p-12 border-default-grey rounded">
      <h1>Structure existante</h1>
      <p>
        La structure <Badge type="purple">{dnaCode}</Badge> que vous souhaitez
        ajouter existe déjà.
      </p>
      <p>
        Si vous pensez qu’il s’agit d’une erreur, merci de contacter notre
        support .
      </p>
      <Button
        linkProps={{
          href: `mailto:${BHASILE_CONTACT_EMAIL}?subject=Structure%20existante%20-%20${dnaCode}`,
          target: "_blank",
          rel: "noopener noreferrer",
        }}
      >
        {BHASILE_CONTACT_EMAIL}
      </Button>
    </div>
  );
}
