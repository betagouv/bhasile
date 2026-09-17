import { type BucketItemStat } from "minio";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { filterBlocks } from "@/app/utils/ressources.util";
import { listS3Objects, readS3File, statS3Object } from "@/lib/minio";
import { FilesBlock, MeasureFile } from "@/types/ressources.type";
import {
  measureS3File,
  parseBlock,
  readBlocks,
  readSuggestions,
} from "@/utils-server/ressources.server.util";

vi.mock("@/lib/minio", () => ({
  listS3Objects: vi.fn(),
  readS3File: vi.fn(),
  statS3Object: vi.fn(),
}));

const measureFileStub: MeasureFile = async (href) => ({
  extension: href.split(".").pop()?.toUpperCase() ?? "",
  bytes: 1024,
});

const FILES_FRONTMATTER = `---
type: fichiers
titre: Modèles
icone: fr-icon-file-text-line
---
`;

describe("ressources server util", () => {
  describe("parseBlock", () => {
    it("place les liens écrits directement sous un ## dans une section sans titre", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN
      const block = (await parseBlock(
        source,
        "modeles",
        measureFileStub
      )) as FilesBlock;

      // THEN
      expect(block.tabs).toHaveLength(1);
      expect(block.tabs[0].sections).toHaveLength(1);
      expect(block.tabs[0].sections[0].title).toBeNull();
      expect(block.tabs[0].sections[0].links[0]).toMatchObject({
        label: "Arrêté d’autorisation",
        href: "/arrete.odt",
        file: { extension: "ODT", bytes: 1024 },
      });
    });

    it("recompose le libellé d’un lien qui contient du balisage inline", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté **type** 2024](/modeles/arrete.odt)
`;

      // WHEN
      const block = (await parseBlock(
        source,
        "modeles",
        measureFileStub
      )) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections[0].links[0]).toMatchObject({
        label: "Arrêté type 2024",
        href: "/modeles/arrete.odt",
        file: { extension: "ODT", bytes: 1024 },
      });
    });

    it("extrait chacun des liens écrits sur une même ligne", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté](/arrete.odt) puis [Convention](/convention.pdf)
`;

      // WHEN
      const block = (await parseBlock(
        source,
        "modeles",
        measureFileStub
      )) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections[0].links).toMatchObject([
        { label: "Arrêté", href: "/arrete.odt" },
        { label: "Convention", href: "/convention.pdf" },
      ]);
    });

    it("crée une section titrée par ### et conserve l’ordre d’écriture", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté d’autorisation](/arrete.odt)

### Structures subventionnées

- [Marché public](/marche.odt)
`;

      // WHEN
      const block = (await parseBlock(
        source,
        "modeles",
        measureFileStub
      )) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections.map((section) => section.title)).toEqual([
        "Structures autorisées",
        "Structures subventionnées",
      ]);
    });

    it("écarte une section qui ne contient aucun lien", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Section vide

Du texte sans aucun lien.

### Section remplie

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN
      const block = (await parseBlock(
        source,
        "modeles",
        measureFileStub
      )) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections.map((section) => section.title)).toEqual([
        "Section remplie",
      ]);
    });

    it("recopie les titres du bloc, de l’onglet et de la section dans le searchText du lien", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN
      const block = (await parseBlock(
        source,
        "modeles",
        measureFileStub
      )) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections[0].links[0].searchText).toBe(
        "modeles actes administratifs structures autorisees arrete d autorisation"
      );
    });

    it("laisse un lien externe sans fichier et ne tente pas de le mesurer", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Webinaires

- [Webinaire du 12 mars](https://webinaire.gouv.fr/xyz)
`;
      const measureForbidden: MeasureFile = async () => {
        throw new Error("measureFile ne doit pas être appelé");
      };

      // WHEN
      const block = (await parseBlock(
        source,
        "ressources",
        measureForbidden
      )) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections[0].links[0]).toMatchObject({
        label: "Webinaire du 12 mars",
        href: "https://webinaire.gouv.fr/xyz",
        file: null,
      });
    });

    it("rejette un fichier sans frontmatter", async () => {
      // GIVEN
      const source = `## Actes administratifs\n\n- [Arrêté](/arrete.odt)\n`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/Frontmatter absent/);
    });

    it("rejette un type de bloc inconnu", async () => {
      // GIVEN
      const source = `---
type: video
titre: Vidéos
icone: fr-icon-play-line
---

## Onglet
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "videos", measureFileStub)
      ).rejects.toThrow();
    });

    it("rejette un bloc sans aucun onglet", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/aucun onglet/);
    });

    it("rejette un bloc dont tous les onglets sont vides", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Onglet sans lien

Du texte, mais aucun lien à télécharger.
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/aucun onglet exploitable/);
    });

    it("rejette du contenu placé avant le premier onglet", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
Une introduction orpheline.

## Actes administratifs

- [Arrêté](/arrete.odt)
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/avant le premier onglet/);
    });

    it("rejette un sous-titre placé avant tout onglet", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
### Sous-titre orphelin

- [Arrêté](/arrete.odt)
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/avant le premier onglet/);
    });

    it("rejette deux onglets portant le même titre dans un bloc", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté](/arrete.odt)

## Actes administratifs

- [Convention](/convention.odt)
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/deux onglets portent le même titre/);
    });

    it("rejette deux sous-titres identiques dans un onglet", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté](/arrete.odt)

### Structures autorisées

- [Convention](/convention.odt)
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/deux sous-titres identiques/);
    });

    it("rejette deux liens pointant vers le même fichier dans une section", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté d’autorisation](/arrete.odt)
- [Arrêté (copie)](/arrete.odt)
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).rejects.toThrow(/est listé deux fois dans la même section/);
    });

    it("accepte le même fichier référencé dans deux sections distinctes", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté d’autorisation](/arrete.odt)

### Structures subventionnées

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFileStub)
      ).resolves.not.toThrow();
    });

    it("propage l’erreur de mesure quand un lien pointe vers un fichier absent", async () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté](/absent.odt)
`;
      const measureFailing: MeasureFile = async () => {
        throw new Error("Lien mort : « /absent.odt »");
      };

      // WHEN / THEN
      await expect(
        parseBlock(source, "modeles", measureFailing)
      ).rejects.toThrow(/Lien mort/);
    });
  });

  describe("measureS3File", () => {
    const FIXTURE_NAME = "test-fixture mesure fichier.pdf";

    it("mesure un fichier du bucket S3 dont le nom contient des espaces encodées", async () => {
      // GIVEN
      vi.mocked(statS3Object).mockResolvedValueOnce({
        size: 2048,
      } as BucketItemStat);

      // WHEN
      const file = await measureS3File(`/${encodeURIComponent(FIXTURE_NAME)}`);

      // THEN
      expect(file).toEqual({ extension: "PDF", bytes: 2048 });
      expect(statS3Object).toHaveBeenCalledWith(
        FIXTURE_NAME,
        expect.any(String)
      );
    });

    it("rejette une séquence d’échappement mal formée", async () => {
      // WHEN / THEN
      await expect(measureS3File("/rapport%zz.pdf")).rejects.toThrow(
        /mal formée/
      );
    });

    it("rejette un fichier absent du bucket", async () => {
      // GIVEN
      vi.mocked(statS3Object).mockRejectedValueOnce(
        new Error("File not found")
      );

      // WHEN / THEN
      await expect(measureS3File("/introuvable.odt")).rejects.toThrow(
        /Lien mort/
      );
    });
  });

  describe("contenu distant S3", () => {
    const MOCK_FILES: Record<string, string> = {
      "01-modeles.md": `${FILES_FRONTMATTER}
## Actes administratifs — HUDA / CADA

### Structures autorisées

- [Arrêté d’autorisation](/07-Fiche_de_parametrage_OFII-transformation_parc.xlsx)
`,
      "_suggestions.md": `- huda cada\n`,
    };

    beforeAll(() => {
      vi.mocked(listS3Objects).mockResolvedValue(Object.keys(MOCK_FILES));
      vi.mocked(statS3Object).mockResolvedValue({
        size: 1024,
      } as BucketItemStat);
      vi.mocked(readS3File).mockImplementation(async (objectKey) => {
        const content = MOCK_FILES[objectKey];
        if (!content) {
          throw new Error(`Fichier introuvable sur S3 : ${objectKey}`);
        }
        return content;
      });
    });

    it("parse tous les blocs depuis S3 sans erreur", async () => {
      // WHEN / THEN
      await expect(readBlocks()).resolves.not.toThrow();
    });

    it("produit des identifiants d’onglets uniques", async () => {
      // WHEN
      const blocks = await readBlocks();
      const tabIds = blocks.flatMap((block) => block.tabs.map((tab) => tab.id));

      // THEN
      expect(new Set(tabIds).size).toBe(tabIds.length);
    });

    it("retrouve un onglet ponctué d’un tiret cadratin quand on tape les mots sans ponctuation", async () => {
      // GIVEN
      const blocks = await readBlocks();

      // WHEN
      const result = filterBlocks(blocks, "huda cada");

      // THEN
      expect(result.length).toBeGreaterThan(0);
    });

    it("propose des recherches suggérées qui remontent au moins un résultat", async () => {
      // GIVEN
      const blocks = await readBlocks();
      const suggestions = await readSuggestions();

      // WHEN
      const suggestionsWithoutResult = suggestions.filter(
        (suggestion) => filterBlocks(blocks, suggestion).length === 0
      );

      // THEN
      expect(suggestionsWithoutResult).toEqual([]);
    });
  });
});
