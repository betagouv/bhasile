"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/app/components/common/Badge";

export default function ExisteDeja() {
  const searchParams = useSearchParams();
  const codeBhasile = searchParams.get("codeBhasile");

  const BHASILE_CONTACT_EMAIL =
    process.env.NEXT_PUBLIC_BHASILE_CONTACT_EMAIL || "";

  return (
    <div className="max-w-xl mx-auto mt-auto h-[calc(60vh-12rem)] text-center flex flex-col items-center justify-center animate-fade-in border bg-white shadow-md p-12 border-default-grey rounded">
      <h1>Structure existante</h1>
      <p>
        La structure <Badge type="purple">{codeBhasile}</Badge> que vous
        souhaitez ajouter existe déjà.
      </p>
      <p>
        Si vous pensez qu’il s’agit d’une erreur, merci de contacter notre
        support .
      </p>
      <Button
        linkProps={{
          href: `mailto:${BHASILE_CONTACT_EMAIL}?subject=Structure%20existante%20-%20${codeBhasile}`,
          target: "_blank",
          rel: "noopener noreferrer",
        }}
      >
        {BHASILE_CONTACT_EMAIL}
      </Button>
    </div>
  );
}
