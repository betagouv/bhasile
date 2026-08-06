import { describe, expect, it } from "vitest";

import {
  measurePublicFile,
  parseBlock,
  readBlocks,
  readSuggestions,
} from "@/app/utils/ressources.server.util";
import { filterBlocks } from "@/app/utils/ressources.util";
import {
  FaqBlock,
  FilesBlock,
  MeasureFile,
} from "@/types/ressources.type";

const measureFileStub: MeasureFile = (href) => ({
  extension: href.split(".").pop()?.toUpperCase() ?? "",
  bytes: 1024,
});

const FILES_FRONTMATTER = `---
type: fichiers
titre: Modèles
icone: fr-icon-file-text-line
---
`;

const FAQ_FRONTMATTER = `---
type: faq
titre: FAQ
icone: fr-icon-question-answer-line
---
`;

describe("ressources server util", () => {
  describe("parseBlock", () => {
    it("place les liens écrits directement sous un ## dans une section sans titre", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN
      const block = parseBlock(source, "modeles", measureFileStub) as FilesBlock;

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

    it("crée une section titrée par ### et conserve l’ordre d’écriture", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté d’autorisation](/arrete.odt)

### Structures subventionnées

- [Marché public](/marche.odt)
`;

      // WHEN
      const block = parseBlock(source, "modeles", measureFileStub) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections.map((section) => section.title)).toEqual([
        "Structures autorisées",
        "Structures subventionnées",
      ]);
    });

    it("écarte une section qui ne contient aucun lien", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Section vide

Du texte sans aucun lien.

### Section remplie

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN
      const block = parseBlock(source, "modeles", measureFileStub) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections.map((section) => section.title)).toEqual([
        "Section remplie",
      ]);
    });

    it("recopie les titres du bloc, de l’onglet et de la section dans le searchText du lien", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN
      const block = parseBlock(source, "modeles", measureFileStub) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections[0].links[0].searchText).toBe(
        "modeles actes administratifs structures autorisees arrete d autorisation"
      );
    });

    it("rend une réponse FAQ multi-paragraphes en HTML et indexe son texte", () => {
      // GIVEN
      const source = `${FAQ_FRONTMATTER}
## Catégorie

### Une question ?

Premier paragraphe avec du **gras**.

Second paragraphe.
`;

      // WHEN
      const block = parseBlock(source, "faq", measureFileStub) as FaqBlock;

      // THEN
      const question = block.tabs[0].questions[0];
      expect(question.title).toBe("Une question ?");
      expect(question.answerHtml).toContain("<strong>gras</strong>");
      expect(question.answerHtml).toContain("<p>Second paragraphe.</p>");
      expect(question.searchText).toContain("second paragraphe");
      expect(question.searchText).not.toContain("strong");
    });

    it("échappe le HTML brut écrit dans une réponse", () => {
      // GIVEN
      const source = `${FAQ_FRONTMATTER}
## Catégorie

### Une question ?

<script>alert(1)</script>
`;

      // WHEN
      const block = parseBlock(source, "faq", measureFileStub) as FaqBlock;

      // THEN
      expect(block.tabs[0].questions[0].answerHtml).not.toContain("<script>");
    });

    it("laisse un lien externe sans fichier et ne tente pas de le mesurer", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Webinaires

- [Webinaire du 12 mars](https://webinaire.gouv.fr/xyz)
`;
      const measureForbidden: MeasureFile = () => {
        throw new Error("measureFile ne doit pas être appelé");
      };

      // WHEN
      const block = parseBlock(
        source,
        "ressources",
        measureForbidden
      ) as FilesBlock;

      // THEN
      expect(block.tabs[0].sections[0].links[0]).toMatchObject({
        label: "Webinaire du 12 mars",
        href: "https://webinaire.gouv.fr/xyz",
        file: null,
      });
    });

    it("sépare les mots d’un retour à la ligne souple dans le searchText", () => {
      // GIVEN
      const source = `${FAQ_FRONTMATTER}
## Catégorie

### Une question ?

fin de ligne
debut de ligne
`;

      // WHEN
      const block = parseBlock(source, "faq", measureFileStub) as FaqBlock;

      // THEN
      expect(block.tabs[0].questions[0].searchText).toContain("ligne debut");
    });

    it("rejette un fichier sans frontmatter", () => {
      // GIVEN
      const source = `## Actes administratifs\n\n- [Arrêté](/arrete.odt)\n`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /Frontmatter absent/
      );
    });

    it("rejette un type de bloc inconnu", () => {
      // GIVEN
      const source = `---
type: video
titre: Vidéos
icone: fr-icon-play-line
---

## Onglet
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "videos", measureFileStub)).toThrow();
    });

    it("rejette un bloc sans aucun onglet", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /aucun onglet/
      );
    });

    it("rejette un bloc dont tous les onglets sont vides", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Onglet sans lien

Du texte, mais aucun lien à télécharger.
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /aucun onglet exploitable/
      );
    });

    it("rejette du contenu placé avant le premier onglet", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
Une introduction orpheline.

## Actes administratifs

- [Arrêté](/arrete.odt)
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /avant le premier onglet/
      );
    });

    it("rejette un sous-titre placé avant tout onglet", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
### Sous-titre orphelin

- [Arrêté](/arrete.odt)
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /avant le premier onglet/
      );
    });

    it("rejette deux onglets portant le même titre dans un bloc", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté](/arrete.odt)

## Actes administratifs

- [Convention](/convention.odt)
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /deux onglets portent le même titre/
      );
    });

    it("rejette deux sous-titres identiques dans un onglet", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté](/arrete.odt)

### Structures autorisées

- [Convention](/convention.odt)
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /deux sous-titres identiques/
      );
    });

    it("rejette deux liens pointant vers le même fichier dans une section", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté d’autorisation](/arrete.odt)
- [Arrêté (copie)](/arrete.odt)
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFileStub)).toThrow(
        /est listé deux fois dans la même section/
      );
    });

    it("accepte le même fichier référencé dans deux sections distinctes", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

### Structures autorisées

- [Arrêté d’autorisation](/arrete.odt)

### Structures subventionnées

- [Arrêté d’autorisation](/arrete.odt)
`;

      // WHEN / THEN
      expect(() =>
        parseBlock(source, "modeles", measureFileStub)
      ).not.toThrow();
    });

    it("rejette deux questions formulées à l’identique dans un onglet", () => {
      // GIVEN
      const source = `${FAQ_FRONTMATTER}
## Catégorie

### Une question ?

Première réponse.

### Une question ?

Seconde réponse.
`;

      // WHEN / THEN
      expect(() => parseBlock(source, "faq", measureFileStub)).toThrow(
        /deux questions sont formulées à l'identique/
      );
    });

    it("propage l’erreur de mesure quand un lien pointe vers un fichier absent", () => {
      // GIVEN
      const source = `${FILES_FRONTMATTER}
## Actes administratifs

- [Arrêté](/absent.odt)
`;
      const measureFailing: MeasureFile = () => {
        throw new Error("Lien mort : « /absent.odt »");
      };

      // WHEN / THEN
      expect(() => parseBlock(source, "modeles", measureFailing)).toThrow(
        /Lien mort/
      );
    });
  });

  describe("measurePublicFile", () => {
    it("mesure un fichier de public/ dont le nom contient des espaces encodées", () => {
      // WHEN
      const file = measurePublicFile(
        "/11-FAQ%20Transformation%20HUDA%20en%20CADA_FV.pdf"
      );

      // THEN
      expect(file.extension).toBe("PDF");
      expect(file.bytes).toBeGreaterThan(0);
    });

    it("rejette un chemin qui sort du dossier public", () => {
      // WHEN / THEN
      expect(() => measurePublicFile("/../package.json")).toThrow(
        /sort du dossier/
      );
    });

    it("rejette un chemin qui ne désigne pas un fichier", () => {
      // WHEN / THEN
      expect(() => measurePublicFile("/")).toThrow(/ne désigne pas un fichier/);
    });

    it("rejette une séquence d’échappement mal formée", () => {
      // WHEN / THEN
      expect(() => measurePublicFile("/rapport%zz.pdf")).toThrow(/mal formée/);
    });

    it("rejette un fichier absent de public/", () => {
      // WHEN / THEN
      expect(() => measurePublicFile("/introuvable.odt")).toThrow(/Lien mort/);
    });
  });

  describe("contenu réel du dépôt", () => {
    it("parse tous les blocs de content/ressources sans lien mort", () => {
      // WHEN / THEN
      expect(() => readBlocks()).not.toThrow();
    });

    it("produit des identifiants d’onglets uniques", () => {
      // WHEN
      const ids = readBlocks().flatMap((block) => block.tabs.map((tab) => tab.id));

      // THEN
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("retrouve un onglet ponctué d’un tiret cadratin quand on tape les mots sans ponctuation", () => {
      // GIVEN
      const blocks = readBlocks();

      // WHEN
      const result = filterBlocks(blocks, "huda cada");

      // THEN
      expect(result.length).toBeGreaterThan(0);
    });

    it("propose des recherches suggérées qui remontent au moins un résultat", () => {
      // GIVEN
      const blocks = readBlocks();

      // WHEN
      const suggestionsWithoutResult = readSuggestions().filter(
        (suggestion) => filterBlocks(blocks, suggestion).length === 0
      );

      // THEN
      expect(suggestionsWithoutResult).toEqual([]);
    });
  });
});
