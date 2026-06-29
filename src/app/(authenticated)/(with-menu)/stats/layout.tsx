import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { StatistiquesProvider } from "./_context/StatistiquesContext";

async function getStatistiques(): Promise<StatistiqueApiRead> {
  try {
    const baseUrl = process.env.NEXT_URL || "";
    // TODO : remplacer par les vrais filtres
    const params = new URLSearchParams();
    params.append("departements", "01,02,03,04,05");
    params.append("operateurs", "1,2,3");
    params.append("types", "CADA,HUDA,CPH,CAES");
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

export default async function StatistiquesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const statistiques = await getStatistiques();

  return (
    <StatistiquesProvider statistiques={statistiques}>
      <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
        <StatistiquesHeader />
        <div className="flex flex-col gap-3 px-3">{children}</div>
      </div>
    </StatistiquesProvider>
  );
}
