# Places autorisées et versionnage des structures

Comment la capacité d'une structure et le détail de ses places sont stockés, lus et modifiés. Le seuil `PLACES_VERSIONED_FROM_YEAR` (2026 par défaut) sépare deux régimes.

## Trois notions séparées

- **Historique pré-versionné (≤ 2025)** : `placesAutorisees` sur `StructureTypologie`, une ligne par année, solde au 31 décembre saisi à la main. Immuable, sans date de changement ni acte ; **ne se prolonge pas** après le seuil.
- **Capacité versionnée (≥ 2026)** : `placesAutorisees` est un scalaire de `StructureVersion` porté par une `effectiveDate`. `StructureTypologie.placesAutorisees` est neutralisé au-delà du seuil (`resolveWritablePlacesForYear` ->`null`) : **seule une transformation finalisée fait bouger la capacité**.
- **Détail des places** : `pmr`, `lgbt`, `fvvTeh` restent sur `StructureTypologie`, annuels, pour toutes les années, modifiables directement sans transformation.

| Donnée                      | Support              | Modifiable par                    | Prise d'effet                        |
| --------------------------- | -------------------- | --------------------------------- | ------------------------------------ |
| `placesAutorisees` (≥ 2026) | `StructureVersion`   | **Uniquement une transformation** | À l'`effectiveDate` de la version    |
| `pmr`, `lgbt`, `fvvTeh`     | `StructureTypologie` | Édition directe **et** transfos   | **Immédiate**, sur l'année concernée |

## Lecture

[`resolvePlacesAutoriseesForYear`](../src/app/api/structure-typologies/structure-typologie.util.ts) unifie les deux régimes : pour une année ≥ seuil, elle résout la version valide au 31 décembre plafonné à `now`. Le 31 décembre n'est qu'une **projection d'affichage** ; en base, la vérité est l'`effectiveDate`. Le plafonnement à `now` évite qu'une transformation à effet futur soit comptée trop tôt.

## Conséquence : les places spéciales d'une transfo future s'affichent dès finalisation de la transfo

À la finalisation, `copyStructureTypologiesToStructures` recopie les typologies déclarées sur la `StructureTypologie` live (`structureId` + `year`). `placesAutorisees` y étant neutralisé, la capacité n'apparaît **qu'à la date d'effet** ; mais `pmr` / `lgbt` / `fvvTeh` sont écrits verbatim et s'affichent **immédiatement**, avant la prise d'effet. **Compromis assumé** : garder les places spéciales sur un axe annuel coûte cet affichage anticipé — le besoin d'historique daté ne portait que sur la capacité.

## `StructureVersion`

Porte l'état daté d'une structure (champs scalaires : `nom`, adresse, `public`... + tables liées). Ces champs subsistent en double sur `Structure` le temps du backfill.

- **Version de base** (sans `transformationId`), mise à jour en place hors transfo : pas d'historique daté des corrections courantes. Son `placesAutorisees` suit le dernier solde legacy (`mirrorLegacyPlacesToBaseVersions`).
- **Transformations** : ajoutent des versions **datées** (`effectiveDate`, `transformationId`), figées à la finalisation. Aucune duplication hors de ces jalons.
- **Résolution** : dernière version dont `effectiveDate ≤ date de référence`, valide seulement si `Form.status === true` pour une transfo. Une version future déclenche un bandeau.

**Périmètre** — porté par la version : `StructureTypologie`, `Contact`, `Adresse`, `Antenne`, `Finess` (via `StructureFiness`), `DnaStructure`. Annuel sur `StructureMillesime` : `Budget`, `IndicateurFinancier`. Hors périmètre : CPOM, référentiel DNA, `Controle`, `Evaluation`, `Note`, `ActeAdministratif`, `DocumentFinancier`.
