# API `GET /api/statistiques`

Stats agrégées parc hébergement (dashboard agents ProConnect).

## Architecture

```
route.ts → statistique.service.ts
              ├── shared/
              ├── structures/ | places/ | finance/ | controle-qualite/ | activite/
```

Schéma : `src/schemas/api/statistique.schema.ts`.

## Paramètres

| Param | Description |
|-------|-------------|
| `departements` | Numéros `,`-séparés (`01,02`) |
| `operateurs` | IDs `,`-séparés (filiales incluses) |
| `types` | `StructureType` (`CADA,CPH`) |
| `aggregation` | `moyenne` (défaut) ou `mediane` — finance + contrôle qualité |

Sans filtre → tout le parc. Filtres en **ET**.

```
GET /api/statistiques?departements=01,02&types=CADA&aggregation=mediane
```

Périmètre vide → `null` (200).

## Périmètre

- Base : structures match filtres (`buildStructureWhere`).
- **Actives** (places, CQ, répartitions) : au moins une `StructureTypologie`.
- Sans typologie : comptées dans `structures.totalStructures` seulement.
- Liens : `structureId` ou `dnaCode` → `DnaStructure`.

Détail onglets → README blocs.

## `aggregation`

| Valeur | Effet |
|--------|-------|
| `moyenne` | Moyenne arithmétique |
| `mediane` | Médiane |

Exposé dans `finance.aggregation` et `controleQualite.aggregation`.

## Format nombres

- Taux (ratios) : 3 déc.
- Décimaux (`tauxEncadrement`, `coutJournalier`, notes, `totalETP`) : 1 déc.
- Comptages / montants : brut.

## Typologie — dernière valeur non nulle

Vue globale places + répartitions structures : par structure/champ (`placesAutorisees`, `pmr`, `lgbt`, `fvvTeh`), 1ʳᵉ valeur non `null` du millésime le plus récent au plus ancien.

`byYear` = millésime exact (pas cette résolution).

## Séries temporelles

Indicateurs recalculés sur données brutes de la période — front ne recombine pas sous-périodes (ex. moyenne de moyennes mensuelles).

## TODO

| ID | Sujet |
|----|--------|
| **TODO(fermeture)** | Exclure structures fermées effectivement. |
| **TODO(actualisation)** | `updatedAt` par bloc. |
| **TODO(structure-version)** | Pivot `shared/` : dernière `StructureVersion` effective (`effectiveDate` ≤ aujourd'hui), plus `Structure.type` / `departementAdministratif` directs. Chantier transformations. |

## Onglets

| Bloc | README |
|------|--------|
| `structures` | [structures/README.md](./structures/README.md) |
| `places` | [places/README.md](./places/README.md) |
| `finance` | [finance/README.md](./finance/README.md) |
| `controleQualite` | [controle-qualite/README.md](./controle-qualite/README.md) |
| `activite` | [activite/README.md](./activite/README.md) |
