import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SpreadsheetImport } from "@/components/SpreadsheetImport";
import { FetchStateProvider } from "@/contexts/FetchStateContext";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/parametres/cockpit-admin/import-ofii",
}));

const spreadsheet = new File(["contenu"], "Liste 10.25.xlsx", {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

const respondWith = (...bodies: { ok?: boolean; body: unknown }[]) => {
  global.fetch = vi.fn();
  for (const { ok = true, body } of bodies) {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok,
      status: ok ? 200 : 400,
      json: async () => body,
    } as Response);
  }
};

const selectFile = async ({ withMonth = false } = {}) => {
  const user = userEvent.setup();
  const { container } = render(
    <FetchStateProvider>
      <SpreadsheetImport
        endpoint="/api/ofii-imports"
        label="Fichier OFII"
        intro="Chargez le fichier."
        withMonth={withMonth}
      />
    </FetchStateProvider>
  );
  await user.upload(
    container.querySelector<HTMLInputElement>('input[type="file"]')!,
    spreadsheet
  );
  return user;
};

describe("SpreadsheetImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propose le fichier d'exemple en téléchargement", () => {
    render(
      <FetchStateProvider>
        <SpreadsheetImport
          endpoint="/api/ofii-imports"
          label="Fichier OFII"
          intro="Chargez le fichier."
          exampleHref="/exemple.xlsx"
        />
      </FetchStateProvider>
    );

    expect(
      screen.getByRole("link", { name: "Télécharger un fichier d’exemple" })
    ).toHaveAttribute("href", "/exemple.xlsx");
  });

  it("liste les lignes à corriger sans proposer l'import", async () => {
    respondWith({
      body: {
        summary: "Fichier de octobre 2025 : 2 structures",
        errors: [{ key: "C0302", issues: ["opérateur « X » inconnu"] }],
      },
    });

    await selectFile();

    expect(
      await screen.findByText("C0302 : opérateur « X » inconnu")
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/ofii-imports/preview",
      expect.objectContaining({ method: "POST" })
    );
    expect(
      screen.queryByRole("button", { name: "Confirmer l’import" })
    ).not.toBeInTheDocument();
  });

  it("simule l'import puis l'exécute après confirmation", async () => {
    respondWith(
      {
        body: {
          summary: "1200 structures dans le fichier",
          changes: ["3 nouvelles structures"],
          errors: [],
        },
      },
      { body: { summary: "1200 structures importées" } }
    );

    const user = await selectFile();
    expect(
      await screen.findByText("3 nouvelles structures")
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await user.click(
      await screen.findByRole("button", { name: "Confirmer l’import" })
    );

    expect(
      await screen.findByText("1200 structures importées")
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/ofii-imports",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("refuse un fichier trop volumineux sans l'envoyer", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn();
    const { container } = render(
      <FetchStateProvider>
        <SpreadsheetImport
          endpoint="/api/ofii-imports"
          label="Fichier OFII"
          intro="Chargez le fichier."
        />
      </FetchStateProvider>
    );
    const bigFile = new File(["x"], "Liste 10.25.xlsx", {
      type: spreadsheet.type,
    });
    Object.defineProperty(bigFile, "size", { value: 42 * 1024 * 1024 });

    await user.upload(
      container.querySelector<HTMLInputElement>('input[type="file"]')!,
      bigFile
    );

    expect(
      (await screen.findAllByText(/Fichier trop volumineux/)).length
    ).toBeGreaterThan(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("explique pourquoi un fichier est refusé", async () => {
    respondWith({
      ok: false,
      body: { error: "Le fichier ne contient aucune ligne de structure" },
    });

    await selectFile();

    expect(
      await screen.findAllByText(
        "Le fichier ne contient aucune ligne de structure"
      )
    ).not.toHaveLength(0);
  });

  it("propose le mois détecté et l'envoie après confirmation", async () => {
    respondWith(
      {
        body: {
          summary: "1 structure",
          changes: [],
          detectedMonth: "2025-10",
          errors: [],
        },
      },
      { body: { summary: "1 structure importée" } }
    );

    const user = await selectFile({ withMonth: true });
    expect(await screen.findByLabelText("Mois")).toHaveValue("10");
    expect(screen.getByLabelText("Année")).toHaveValue("2025");
    await user.click(
      screen.getByRole("button", {
        name: "Confirmer l’import pour octobre 2025",
      })
    );

    await screen.findByText("1 structure importée");
    const [, init] = vi.mocked(global.fetch).mock.lastCall!;
    expect((init?.body as FormData).get("month")).toBe("2025-10");
  });

  it("fait saisir le mois quand il n'a pas pu être déduit du fichier", async () => {
    respondWith({
      body: {
        summary: "1 structure",
        changes: [],
        detectedMonth: null,
        errors: [],
      },
    });

    const user = await selectFile({ withMonth: true });
    expect(
      await screen.findByRole("button", { name: "Confirmer l’import" })
    ).toBeDisabled();

    const year = screen.getByLabelText("Année");
    await user.selectOptions(screen.getByLabelText("Mois"), "09");
    await user.selectOptions(
      year,
      within(year).getAllByRole("option")[1] as HTMLOptionElement
    );

    expect(
      screen.getByRole("button", {
        name: /Confirmer l’import pour septembre/,
      })
    ).toBeEnabled();
  });
});
