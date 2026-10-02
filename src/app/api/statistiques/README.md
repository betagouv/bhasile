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
        ├── statistiques.repository.ts | statistiques.util.ts
        └── structures/ | places/ | finance/ | controle-qualite/ | activite/ | rmu/
              └── *.util.ts   compute*(context[, aggregation])
```

- **repository** : uniquement à la racine - chargement dans `buildStatistiquesContext`
- **util** : `computeXStatistiques(context[, aggregation])` - lecture de l'activité via `lookupActiveStructureIds` ; pour les `byYear`, structures comptabilisées via `resolveCountedStructuresForYear` / `mapTypologieYears`

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

**Structures initialisées uniquement** : le périmètre ne retient que les structures dont le formulaire `finalisation-v1` est validé ou qui sont nées d'une création par transformation finalisée (même règle que `isStructureFinalised`, celle qui ouvre une campagne d'actualisation à une structure). Une structure non initialisée n'entre dans aucun indicateur, assiette globale comprise.

**Structures actives (indicateurs globaux)** : `activeStructureIdsNow` sur `StatistiquesContext` - structures ouvertes au jour de référence (`Structure.creationDate` / `fermetureDate`). `context.structures` en est la projection typée.

**Activité par période (séries temporelles)** : index `activeStructureIdsByPeriod` (`month`, `trimester`, `year` -> `Set` d'IDs actifs). Une structure fermée le 05/05 compte sur janvier à mai, pas sur juin.

Les deux sont construits **une seule fois** dans `buildStatistiquesContext` via `buildActivityIndex`. Les sous-modules lisent `activeStructureIdsNow` ou `lookupActiveStructureIds` - ils ne recalculent jamais l'activité.

**Données rattachées à une `StructureVersion` datée** (ex. `Adresse`) : `filterByEffectiveVersionAtDate` résout, pour une date donnée (plafonnée à aujourd'hui), la `StructureVersion` effective de chaque structure via `structureVersionTimeline`, puis ne garde que les lignes de cette version - même principe que `lookupStructureIdsForDnaAtDate` pour les liens DNA. Voir [places/README.md](./places/README.md) pour l'usage sur `qpv`/`logementsSociaux`.

**Avec typologie** (≥1 `StructureTypologie`) : requis pour agrégats places, répartitions type/bâti, contrôle qualité. `structures.totalStructures` = structures actives (avec ou sans typologie).

## Structures comptabilisées par année

Tous les indicateurs annuels (`byYear`) des blocs `structures`, `places` et `finance` partent du même ensemble de structures, résolu par `resolveCountedStructuresForYear` (`completude.util.ts`) :

| Année                                                  | Structures comptabilisées                                         | `completude` |
| ------------------------------------------------------ | ----------------------------------------------------------------- | ------------ |
| Initialisation (avant la première campagne − 1)        | Toutes les structures actives sur l'année                         | `null`       |
| Campagne (à partir de la première campagne − 1)        | Structures actives sur l'année **et** actualisées sur cette année | renseigné    |
| Aucune campagne déclarée (`FormDefinition` absente)    | Toutes les structures actives sur l'année                         | `null`       |

Une structure est **actualisée sur l'année N** quand sa dernière campagne validée (`Form.status` sur `actualisation-M`) vérifie `M >= N` : valider une campagne atteste toutes les années jusqu'à elle.

**Décalage finance.** Pour le bloc `finance` (et les indicateurs `finance.*` de la cartographie), la frontière recule d'un an de plus : « première campagne − 2 », soit 2024 avec la campagne 2026. Le formulaire d'actualisation 2026 est en effet celui qui rend obligatoire le réalisé 2024 (ETP réalisé, résultat des structures subventionnées, dotations des structures autorisées), qui n'était pas disponible à l'initialisation. Constantes `FIRST_CAMPAGNE_LOOKBACK_YEARS` / `FIRST_CAMPAGNE_FINANCE_LOOKBACK_YEARS`.

**Frontière.** Elle est posée une fois par la première campagne jamais déclarée et vaut « année de cette campagne − 1 ». Avec la campagne 2026 : 2021 à 2024 sont des années d'initialisation, 2025 et 2026 sont filtrées sur les structures ayant validé la campagne 2026. Que 2025 soit couvert par la campagne 2026 est un cas particulier de démarrage (projet initié en 2024, aucune actualisation depuis) ; les campagnes suivantes ne déplacent pas la frontière.

### `completude`

| Champ           | Contenu                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------- |
| `nbRenseignees` | Nombre de structures comptabilisées sur l'année (exactement celles qui alimentent les chiffres) |
| `nbAttendues`   | Structures du périmètre encore ouvertes fin d'année, plus les structures comptabilisées qui ont fermé dans l'année |
| `isComplete`    | `nbRenseignees >= nbAttendues`                                                                  |
| `reason`        | `SAISIE_EN_COURS` tant qu'une campagne postérieure ou égale à l'année est ouverte (`FormDefinition.deadline`), `SAISIE_INCOMPLETE` ensuite, `null` si complet |

Une structure fermée en cours d'année sans avoir actualisé n'est pas attendue : elle n'a plus à être actualisée sur cette année ni sur les suivantes.

### Choix retenus (octobre 2026) et raisons

- **Le formulaire d'actualisation validé est le seul driver.** Pas de driver par bloc ni dérivé de la présence de la donnée (millésime, budget) : une structure pré-remplie ou transformée mais non actualisée serait comptée dans les chiffres sans l'être dans le score.
- **Le filtre s'applique aussi aux données que l'actualisation ne demande pas** (type de structure, bâti, CPOM). Le formulaire ne demande que les places par typologie, les budgets et les indicateurs financiers, mais on garde une assiette commune à tous les indicateurs annuels d'un même bloc. Effet voulu : une structure fermée dans la réalité mais jamais fermée dans l'outil sort d'elle-même des chiffres de l'année, ce qui pousse à la fermer.
- **Conséquence 1 : début de campagne.** Les indicateurs de l'année en cours reposent sur peu de structures tant que peu ont validé ; c'est `completude` qui l'explique à l'utilisateur.
- **Conséquence 2 : écart avec l'assiette globale.** Les indicateurs globaux (`structures.totalStructures`, `totalPlaces`, `totalCpoms`, encart `places`) ne dépendent pas des actualisations et portent sur toutes les structures actives. Ils ne sont donc pas la somme des indicateurs de l'année en cours.
- **Ceci tranche l'ancien TODO sur `byYear.totalStructures`** (décrochage des années récentes) : le décrochage est désormais assumé et chiffré par `completude`.
- **Pas de complétude sur `activite`, `rmu` et `controleQualite`** : ces données arrivent par import de bloc ou par API (DNA, EIG), pas par une saisie attendue structure par structure.
- **La cartographie suit la même règle** (`structures.*`, `places.*` par année, `finance.*`), pour ne pas afficher d'autres chiffres que la page Statistiques.

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

Récap des points ouverts - le détail est dans le README de chaque bloc. La mention « Données mises à jour le … » par bloc est abandonnée : elle laissait entendre que toutes les données du bloc étaient complètes, `completude` la remplace.

Points encore ouverts ou à garder en tête pour l'interprétation des chiffres. Les TODO « post transfo » traités (pivot `StructureVersion`, fermeture via `Structure.fermetureDate` / `activeStructureIdsNow`) ne sont plus listés ici.

| Sujet                                                 | Bloc              | Détail                                                                                                              |
| ----------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Reconstitution `qpv`/`logementsSociaux` par année** | `places`          | [places/README.md](./places/README.md#todo-à-valider)                                                               |
| **Agrégation bâti `Mixte`**                           | `structures`      | [structures/README.md](./structures/README.md#todo-à-valider)                                                       |
| **Cibles par année à saisir**                         | `finance`         | [finance/README.md](./finance/README.md#cibles)                                                                     |
| **Fenêtre évaluations vs EIG**                        | `controleQualite` | [controle-qualite/README.md](./controle-qualite/README.md#todo-métier)                                              |
| **Clés de période CQ**                                | `controleQualite` | [controle-qualite/README.md](./controle-qualite/README.md#todo-métier)                                              |
