# `structures`

Périmètre, filtres : [README parent](../README.md).

## Typologie (`StructureTypologie`)

Millésime annuel : places autorisées, PMR, etc. Une structure peut exister sans aucune ligne typologie (jamais renseignée).

| Périmètre | Règle |
|-----------|--------|
| `totalStructures` | Toutes structures filtrées, **avec ou sans** typologie |
| `structureTypes[]`, `structureBatis[]`, onglets places/CQ… | **Structures actives** uniquement = au moins une ligne `StructureTypologie` |

## Vue globale

| Champ | Calcul |
|-------|--------|
| `totalStructures` | Toutes structures filtrées |
| `totalCpoms` | CPOM distincts actifs année courante, même logique que `isStructureInCpom` (fiche structure) |
| `structuresAvecCpom` | Structures avec ≥1 CPOM actif année courante |
| `structureTypes[]` | Par `Structure.type` — structures actives ; places = somme `placesAutorisees` résolues |
| `structureBatis[]` | Par bâti structure — structures actives ; places idem |

### CPOM actif (`isStructureInCpom`)

Même helper que fiche structure (`structure.util.ts`), appelé avec `{ cpomStructures: [...] }` :

1. Dates effectives = `CpomStructure.dateStart` / `dateEnd`, repli sur dates convention CPOM (`getDatesConvention` → acte administratif `CONVENTION` du CPOM, min/max `startDate`/`endDate`).
2. Actif pour l'année N si `yearStart ≤ N ≤ yearEnd`.
3. Dates manquantes après repli → pas actif.

### Bâti structure (`getRepartitionFromRepartitions`)

`Adresse.repartition` par adresse ; même agrégation que `getTypeBati` (fiche structure) via `getRepartitionFromRepartitions` :

- DIFFUS seul → `DIFFUS`
- COLLECTIF seul → `COLLECTIF`
- les deux → `MIXTE`
- aucune adresse avec DIFFUS/COLLECTIF → défaut `COLLECTIF` dans les stats

## `byYear`

Millésime exact `StructureTypologie`. Structures actives = typologie sur l'année. CPOM : `isStructureInCpom` par année.

## Sources

`Structure`, `StructureTypologie`, `Adresse`, `CpomStructure`, `ActeAdministratif` (convention CPOM).
