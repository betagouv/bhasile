import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActualisationAnalyseFinanciere from "@/app/(authenticated)/(with-menu)/structures/[id]/actualisation/[year]/03-analyse-financiere/page";
import { getIndicateursFinanciersDefaultValues } from "@/app/utils/indicateur-financier.util";
import { getCurrentYear } from "@/app/utils/now.util";
import { getRealCreationYear } from "@/app/utils/structure.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

import { createActualisationForm } from "../../../../../../test-utils/factories/actualisation-form.factory";
import { createFinalisationFinanceValidStructure } from "../../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  renderWithStructurePageProviders,
} from "../../../../../../test-utils/structure-page-test.helpers";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: vi.fn() }),
  usePathname: () => "/",
  useParams: () => ({ year: "2026" }),
}));
vi.mock("@/app/components/forms/AutoSave", () => ({ AutoSave: () => null }));

const financeStructure = () => ({
  ...createFinalisationFinanceValidStructure(1),
  forms: [createActualisationForm(2026)],
});

const findActualisationPut = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.find(
    (call) =>
      call[0] === "/api/structures/1/actualisation" &&
      (call[1] as RequestInit | undefined)?.method === "PUT"
  );

const stepStatusInPayload = (put: unknown[] | undefined, slug: string) => {
  const payload = JSON.parse((put?.[1] as RequestInit).body as string);
  return payload.forms[0].formSteps.find(
    (formStep: { stepDefinition: { slug: string } }) =>
      formStep.stepDefinition.slug === slug
  )?.status;
};

describe("Page actualisation 03-analyse-financiere", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("valide l'étape finance via la sous-route actualisation", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => financeStructure(),
    });

    renderWithStructurePageProviders(
      financeStructure(),
      <ActualisationAnalyseFinanciere />
    );

    await clickButtonByName("Valider");

    const put = findActualisationPut(fetchMock);
    expect(put).toBeDefined();
    expect(stepStatusInPayload(put, "03-analyse-financiere")).toBe("VALIDE");
  });

  it("affiche l'erreur d'obligation et bloque quand le réalisé du cutoff manque", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    const structure = financeStructure();
    structure.isInCpomPerYear = { ...structure.isInCpomPerYear, 2024: false };
    structure.indicateursFinanciers = structure.indicateursFinanciers.filter(
      (indicateurFinancier) =>
        !(
          indicateurFinancier.year === 2024 &&
          indicateurFinancier.type === "REALISE"
        )
    );

    renderWithStructurePageProviders(
      structure,
      <ActualisationAnalyseFinanciere />
    );

    await clickButtonByName("Valider");

    expect(screen.getByText(/réalisé 2024.*obligatoire/i)).toBeInTheDocument();
    expect(findActualisationPut(fetchMock)).toBeUndefined();
  });

  it("n'exige les indicateurs financiers que pour les années hors CPOM", async () => {
    // GIVEN
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => financeStructure(),
    });
    const structure = {
      ...financeStructure(),
      indicateursFinanciers: [],
    };
    structure.isInCpomPerYear = {
      ...structure.isInCpomPerYear,
      [getCurrentYear()]: false,
    };
    renderWithStructurePageProviders(
      structure,
      <ActualisationAnalyseFinanciere />
    );

    const indicateursTable = screen.getByRole("table", {
      name: "Indicateurs généraux",
    });
    expect(within(indicateursTable).getAllByText("Hors CPOM")).toHaveLength(1);
    expect(
      within(indicateursTable).getAllByText("En CPOM").length
    ).toBeGreaterThan(0);

    // WHEN
    await clickButtonByName("Valider");

    // THEN
    expect(
      screen.getByText(
        new RegExp(`réalisé ou prévisionnel ${getCurrentYear()}.*requis`, "i")
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/réalisé 2024.*obligatoire/i)).toBeNull();
    expect(findActualisationPut(fetchMock)).toBeUndefined();

    // WHEN
    const previsionnelIndex = getIndicateursFinanciersDefaultValues(
      [],
      getRealCreationYear(structure as unknown as StructureApiRead)
    ).findIndex(
      (indicateurFinancier) =>
        indicateurFinancier.year === getCurrentYear() &&
        indicateurFinancier.type === "PREVISIONNEL"
    );
    for (const field of ["ETP", "tauxEncadrement", "coutJournalier"]) {
      fireEvent.change(
        document.getElementById(
          `indicateursFinanciers.${previsionnelIndex}.${field}`
        ) as HTMLInputElement,
        { target: { value: "12" } }
      );
    }
    await clickButtonByName("Valider");

    // THEN
    const put = findActualisationPut(fetchMock);
    expect(put).toBeDefined();
    expect(stepStatusInPayload(put, "03-analyse-financiere")).toBe("VALIDE");
  });
});
