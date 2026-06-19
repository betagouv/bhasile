# API `GET /api/statistiques`

Statistiques agrégées du parc hébergement.

## TODO post chantier transformation

| ID                          | Sujet                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **TODO(fermeture)**         | Exclure structures fermées effectivement.                                                                                                                                      |
| **TODO(actualisation)**     | `updatedAt` par bloc (sans doute implémentable après le chantier "formulaire d'actualisation").                                                                                |
| **TODO(structure-version)** | Pivot `shared/` : dernière `StructureVersion` effective (`effectiveDate` ≤ aujourd'hui), plus `Structure.type` / `departementAdministratif` directs. Chantier transformations. |

## Onglets

| Bloc              | README                                                     |
| ----------------- | ---------------------------------------------------------- |
| `structures`      | [structures/README.md](./structures/README.md)             |
| `places`          | [places/README.md](./places/README.md)                     |
| `finance`         | [finance/README.md](./finance/README.md)                   |
| `controleQualite` | [controle-qualite/README.md](./controle-qualite/README.md) |
| `activite`        | [activite/README.md](./activite/README.md)                 |

## Architecture

Le service est découpé par "bloc fonctionnel" avec un socle commun

```
route.ts -> statistique.service.ts
              ├── shared/
              ├── structures/ | places/ | finance/ | controle-qualite/ | activite/
```

Schéma : `src/schemas/api/statistique.schema.ts`.

## Paramètres

| Paramètre      | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `departements` | Numéros `,`-séparés (`01,02`)                                           |
| `operateurs`   | IDs `,`-séparés (filiales incluses)                                     |
| `types`        | `StructureType` (`CADA,CPH`)                                            |
| `aggregation`  | `moyenne` (défaut) ou `mediane` (utile pour finance + contrôle qualité) |

Sans filtre l'API retourne tout le parc, et si le périmètre retourné est vide l'API retourne `null`.
Les filtres sont en **ET**.

Exemple :

```
GET /api/statistiques?departements=01,02,03&types=CADA,CPH&operateurs=1,2
```

## Périmètre

Le périmètre de base vient filtrer sur les structures qui matchent le filtre `buildStructureWhere` qui sera à mettre à jour post chantier de Transfo.

## `aggregation`

| Valeur    | Effet                |
| --------- | -------------------- |
| `moyenne` | Moyenne arithmétique |
| `mediane` | Médiane              |

Utile dans `finance.aggregation` et `controleQualite.aggregation`.

## Format nombres

- Taux (ratios) : limité à 3 décimales (le passage en % ou ‰ est à gérer en front)
- Décimaux : limité à 1 décimale
- Comptages / montants : brut

## Typologie - dernière valeur non nulle

Sur les blocs structures et places, l'encart "global" retourne pour chaque champ la première valeur non `null` du millésime le plus récent au plus ancien. Il ne s'agit donc pas d'un "snapshot du premier millésime complet" mais du "meilleur estimatif agrégé des structures non fermées".

Pour tous les `byYear` ou autres agrgéations par date en revanche, on retourne le millésime exact.

## Séries temporelles

Indicateurs recalculés en back sur les données brutes de la période : le front ne peut en effet pas recombiner les sous-périodes de son côté (ex. moyenne de moyennes mensuelles).
