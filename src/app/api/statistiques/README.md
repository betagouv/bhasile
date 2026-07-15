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
| `rmu`             | [rmu/README.md](./rmu/README.md)                           |

## Architecture

Le service est découpé par "bloc fonctionnel" avec un socle commun

```
route.ts -> statistique.service.ts
        ├── statistiques.repository.ts | statistiques.utils.ts
        └── structures/ | places/ | finance/ | controle-qualite/ | activite/ | rmu/
              └── *.util.ts   compute*(context[, aggregation])
```

- **repository** : uniquement à la racine - chargement dans `buildStatistiquesContext`
- **util** : `computeXStatistiques(context[, aggregation])` - lecture de l'activité via `lookupActiveStructureIds` / `mapTypologieYears`

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

> Exception `rmu` (donnée départementale) : ne suit que `departements`, et vaut `null` dès qu'un filtre `operateurs`/`types` est actif. Cf. [rmu/README.md](./rmu/README.md#périmètre).

Exemple :

```
GET /api/statistiques?departements=01,02,03&types=CADA,CPH&operateurs=1,2
```

ou en local

```
curl -s "http://localhost:3000/api/statistiques?departements=01,02,03&types=CADA,CPH&operateurs=1,2" | jq
curl -s "http://localhost:3000/api/statistiques" | jq > tmp/statistiques.json
```

## Périmètre

Filtre structures via `findPerimeterStructures` : `type` / `operateurId` / `departementAdministratif`.

**Structures actives (indicateurs globaux)** : `activeStructureIdsNow` sur `StatistiquesContext` - structures ouvertes au jour de référence (`Structure.creationDate` / `fermetureDate`). `context.structures` en est la projection typée.

**Activité par période (séries temporelles)** : index `activeStructureIdsByPeriod` (`month`, `trimester`, `year` -> `Set` d'IDs actifs). Une structure fermée le 05/05 compte sur janvier à mai, pas sur juin.

Les deux sont construits **une seule fois** dans `buildStatistiquesContext` via `buildActivityIndex`. Les sous-modules lisent `activeStructureIdsNow` ou `lookupActiveStructureIds` - ils ne recalculent jamais l'activité.

**Données rattachées à une `StructureVersion` datée** (ex. `Adresse`) : `filterByEffectiveVersionAtDate` résout, pour une date donnée (plafonnée à aujourd'hui), la `StructureVersion` effective de chaque structure via `structureVersionTimeline`, puis ne garde que les lignes de cette version - même principe que `lookupStructureIdsForDnaAtDate` pour les liens DNA. Voir [places/README.md](./places/README.md) pour l'usage sur `qpv`/`logementsSociaux`.

**Avec typologie** (≥1 `StructureTypologie`) : requis pour agrégats places, répartitions type/bâti, contrôle qualité. `structures.totalStructures` = structures actives (avec ou sans typologie).

## `aggregation`

| Valeur    | Effet                |
| --------- | -------------------- |
| `moyenne` | Moyenne arithmétique |
| `mediane` | Médiane              |

Utile dans `finance.aggregation` et `controleQualite.aggregation`.

## Format nombres

- Taux (ratios) : 3 chiffres significatifs via `roundStatsRate` (le passage en % ou ‰ est à gérer en front)
- Décimaux : limité à 1 décimale
- Comptages / montants : brut

## Typologie - dernière valeur non nulle

Sur les blocs structures et places, l'encart global retourne pour chaque champ la première valeur non `null` du millésime le plus récent au plus ancien (par structure). Ce n'est pas un snapshot d'un millésime complet mais un estimatif champ par champ.

Pour tous les `byYear` ou autres agrégations par date : millésime exact.

## Séries temporelles

Indicateurs recalculés en back sur les données brutes de la période : le front ne peut en effet pas recombiner les sous-périodes de son côté (ex : moyenne de moyennes mensuelles).

## TODO (à valider)

Récap des points ouverts - le détail est dans le README de chaque bloc (sauf `updatedAt`, périmètre global).

Points encore ouverts ou à garder en tête pour l'interprétation des chiffres. Les TODO « post transfo » traités (pivot `StructureVersion`, fermeture via `Structure.fermetureDate` / `activeStructureIdsNow`) ne sont plus listés ici.

| Sujet                                                 | Bloc              | Détail                                                                                                              |
| ----------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **`updatedAt` par bloc**                              | global            | Horodatage « données mises à jour » par onglet : dépend du chantier formulaire d'actualisation, pas encore branché. |
| **Reconstitution `qpv`/`logementsSociaux` par année** | `places`          | [places/README.md](./places/README.md#todo-à-valider)                                                               |
| **Agrégation bâti `Mixte`**                           | `structures`      | [structures/README.md](./structures/README.md#todo-à-valider)                                                       |
| **Fallback `REALISE` → `PREVISIONNEL`**               | `finance`         | [finance/README.md](./finance/README.md#todo-hors-transfo)                                                          |
| **Fenêtre évaluations vs EIG**                        | `controleQualite` | [controle-qualite/README.md](./controle-qualite/README.md#todo-métier)                                              |
| **Clés de période CQ**                                | `controleQualite` | [controle-qualite/README.md](./controle-qualite/README.md#todo-métier)                                              |
