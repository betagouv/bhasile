import { describe, expect, it } from "vitest";

import { countLinks, filterBlocks } from "@/app/utils/ressources.util";
import { Block, FaqBlock, FilesBlock } from "@/types/ressources.type";

const buildLink = (label: string, searchText: string) => ({
  label,
  href: `/${label}.odt`,
  file: { extension: "ODT", bytes: 1024 },
  searchText,
});

const FILES_BLOCK: FilesBlock = {
  id: "modeles",
  title: "Modèles",
  icon: "fr-icon-file-text-line",
  type: "fichiers",
  tabs: [
    {
      id: "modeles--actes",
      title: "Actes administratifs",
      sections: [
        {
          id: "modeles--actes--structures-autorisees",
          title: "Structures autorisées",
          links: [
            buildLink(
              "Arrêté d’autorisation",
              "modeles actes administratifs structures autorisees arrete d autorisation"
            ),
          ],
        },
        {
          id: "modeles--actes--toutes-les-structures",
          title: "Toutes les structures",
          links: [
            buildLink(
              "CPOM",
              "modeles actes administratifs toutes les structures cpom"
            ),
          ],
        },
      ],
    },
    {
      id: "modeles--financiers",
      title: "Documents financiers",
      sections: [
        {
          id: "modeles--financiers--sans-titre",
          title: null,
          links: [
            buildLink(
              "Budget prévisionnel",
              "modeles documents financiers budget previsionnel"
            ),
          ],
        },
      ],
    },
  ],
};

const FAQ_BLOCK: FaqBlock = {
  id: "faq",
  title: "FAQ",
  icon: "fr-icon-question-answer-line",
  type: "faq",
  tabs: [
    { id: "1", title: "Section 1" },
    { id: "2", title: "Section 2" },
  ],
};

const BLOCKS: Block[] = [FILES_BLOCK, FAQ_BLOCK];

describe("ressources filter", () => {
  describe("filterBlocks", () => {
    it("renvoie tous les blocs quand la recherche est vide", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "   ");

      // THEN
      expect(result).toEqual(BLOCKS);
    });

    it("ne conserve que les liens dont le searchText contient le terme et conserve le bloc FAQ", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "budget");

      // THEN
      expect(result).toHaveLength(2);
      const filesBlock = result[0] as FilesBlock;
      expect(filesBlock.tabs).toHaveLength(1);
      expect(filesBlock.tabs[0].title).toBe("Documents financiers");
      expect(result[1]).toEqual(FAQ_BLOCK);
    });

    it("conserve tout le contenu d’un onglet quand le terme correspond à son titre", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "actes administratifs");

      // THEN
      const filesBlock = result[0] as FilesBlock;
      expect(countLinks(filesBlock.tabs[0])).toBe(2);
    });

    it("ignore les accents et la casse", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "AUTORISEES");

      // THEN
      const filesBlock = result[0] as FilesBlock;
      expect(filesBlock.tabs[0].sections[0].title).toBe(
        "Structures autorisées"
      );
    });

    it("trouve un contenu quand les mots sont donnés dans le désordre", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "administratifs actes");

      // THEN
      const filesBlock = result[0] as FilesBlock;
      expect(countLinks(filesBlock.tabs[0])).toBe(2);
    });

    it("exige que tous les mots de la recherche soient présents", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "actes budget");

      // THEN
      expect(result).toEqual([FAQ_BLOCK]);
    });

    it("retire les sections, onglets et blocs de fichiers devenus vides", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "cpom");

      // THEN
      expect(result.map((block) => block.id)).toEqual(["modeles", "faq"]);
      const filesBlock = result[0] as FilesBlock;
      expect(filesBlock.tabs).toHaveLength(1);
      expect(filesBlock.tabs[0].sections).toHaveLength(1);
      expect(filesBlock.tabs[0].sections[0].title).toBe(
        "Toutes les structures"
      );
    });

    it("renvoie uniquement la FAQ quand aucun fichier ne correspond", () => {
      // WHEN
      const result = filterBlocks(BLOCKS, "introuvable");

      // THEN
      expect(result).toEqual([FAQ_BLOCK]);
    });

    it("ne modifie pas les blocs d’origine", () => {
      // GIVEN
      const initialBlocks = JSON.stringify(BLOCKS);

      // WHEN
      filterBlocks(BLOCKS, "cpom");

      // THEN
      expect(JSON.stringify(BLOCKS)).toBe(initialBlocks);
    });
  });
});
