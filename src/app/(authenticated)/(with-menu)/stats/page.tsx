import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { Section } from "@/app/components/common/Section";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { ActiviteBlock } from "./_components/activite/ActiviteBlock";
import { ControleQualiteBlock } from "./_components/controle-qualite/ControleQualiteBlock";
import { FinancesBlock } from "./_components/finances/FinancesBlock";
import { RMUBlock } from "./_components/rmu/RMUBlock";
import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { StructuresBlock } from "./_components/structures/StructuresBlock";
import { TypesPlacesBlock } from "./_components/type-places/TypesPlacesBlock";
import { StatistiquesProvider } from "./_context/StatistiquesContext";

type GetStatistiquesArgs = {
  departements?: string;
  operateurs?: string;
  type?: string;
};

async function getStatistiques({
  departements,
  operateurs,
  type,
}: GetStatistiquesArgs): Promise<StatistiqueApiRead> {
  try {
    const baseUrl = process.env.NEXT_URL || "";
    const params = new URLSearchParams();
    if (departements) {
      params.append("departements", departements);
    }
    if (operateurs) {
      params.append("operateurs", operateurs);
    }
    if (type) {
      params.append("types", type);
    }

    const result = await fetch(
      `${baseUrl}/api/statistiques?${params.toString()}`,
      {
        cache: "no-store",
        // Requête côté serveur donc il faut appeler les headers manuellement
        headers: await headers(),
      }
    );
    if (!result.ok) {
      throw new Error(
        `Impossible de récupérer les statistiques : ${result.status}`
      );
    }
    return await result.json();
  } catch (error) {
    console.error(error);
    notFound();
  }
}

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const awaitedSearchParams = await searchParams;

  const departements =
    typeof awaitedSearchParams.departements === "string"
      ? awaitedSearchParams.departements
      : undefined;
  const operateurs =
    typeof awaitedSearchParams.operateurs === "string"
      ? awaitedSearchParams.operateurs
      : undefined;
  const type =
    typeof awaitedSearchParams.type === "string"
      ? awaitedSearchParams.type
      : undefined;

  const statistiques = await getStatistiques({
    departements,
    operateurs,
    type,
  });

  return (
    <StatistiquesProvider statistiques={statistiques}>
      <div className="flex flex-col h-full gap-3 pb-4">
        <StatistiquesHeader />
        <div className="flex flex-col gap-3 px-3">
          <CustomNotice
            severity="warning"
            title=""
            description="Les structures non finalisées et les PRAHDA ne sont pas comptabilisés ici."
            className="rounded-lg"
          />
          <Section id="structures">
            <StructuresBlock />
          </Section>
          <Section id="types-places">
            <TypesPlacesBlock />
          </Section>
          <Section id="finance">
            <FinancesBlock />
          </Section>
          <Section id="controle-qualite">
            <ControleQualiteBlock />
          </Section>
          <Section id="activite">
            <ActiviteBlock />
          </Section>
          <Section id="rmu">
            <RMUBlock />
          </Section>
        </div>
      </div>
    </StatistiquesProvider>
  );
}
