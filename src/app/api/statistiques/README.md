# API `GET /api/statistiques`

Statistiques agrégées du parc hébergement.

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
        ├── statistiques.repository.ts | statistiques.utils.ts
        ├── structures/ | places/ | finance/ | controle-qualite/ | activite/
```

Schéma : `src/schemas/api/statistique.schema.ts`.

## Paramètres

| Paramètre      | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `departements` | Numéros séparés par des virgules (`01,02`)                              |
| `operateurs`   | IDs séparés par des virgules (filiales incluses)                        |
| `types`        | `StructureType` (`CADA,CPH`)                                            |
| `aggregation`  | `moyenne` (défaut) ou `mediane` (utile pour finance + contrôle qualité) |

Sans filtre l'API retourne tout le parc, et si le périmètre retourné est vide l'API retourne `null`.
Les filtres sont en **ET**.

Exemple :

```
GET /api/statistiques?departements=01,02,03&types=CADA,CPH&operateurs=1,2
```

## Périmètre

Filtre structures via `findEffectiveStructureVersionsAtDate` (pivot sur `StructureVersion` effective).

**Structures actives (indicateurs globaux)** : dernière version à date sans bloc `FERMETURE`.

**Activité par période (`activityContext`)** : dates d'ouverture/fermeture + index `activeStructureIdsByPeriod` (mois, trimestre, année). Une structure fermée le 05/05 compte sur janvier à mai, pas sur juin.

Index construit une fois dans `buildStatistiquesContext` (années typologies + cycle de vie) et complété dans contrôle qualité (mois/trimestres/années des EIG et évaluations). Les blocs lisent via `getActiveStructureIds(activityContext, granularity, periodKey)`.

**Avec typologie** (≥1 `StructureTypologie`) : requis pour agrégats places, répartitions type/bâti, contrôle qualité. `structures.totalStructures` = structures actives (avec ou sans typologie).

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

Sur les blocs structures et places, l'encart global retourne pour chaque champ la première valeur non `null` du millésime le plus récent au plus ancien (par structure). Ce n'est pas un snapshot d'un millésime complet mais un estimatif champ par champ.

Pour tous les `byYear` ou autres agrégations par date : millésime exact.

## Séries temporelles

Indicateurs recalculés en back sur les données brutes de la période : le front ne peut en effet pas recombiner les sous-périodes de son côté (ex : moyenne de moyennes mensuelles).
