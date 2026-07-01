# Cartographie des statistiques

`GET /api/statistiques/cartographie` retourne, pour un indicateur donné, une
valeur par zone (région ou département) avec son évolution par rapport à
l'année précédente. C'est le pendant "carte" de `GET /api/statistiques`
("tableaux & graphiques") : même périmètre de filtres (opérateurs, types,
départements), mais la réponse est une liste de zones plutôt qu'un objet global.

## Paramètres

- `granularite` : `region` | `departement` | `arrondissement`
- `indicateur` : voir catalogue ci-dessous
- `annee` : année de référence (l'évolution compare à `annee - 1`)
- `departements`, `regions` : restriction de zone (CSV, indépendante de
  `granularite` - on peut restreindre à une région et découper par département
  pour zoomer dessus)
- `operateurs`, `types`, `aggregation` : identiques à `/api/statistiques`

`granularite=arrondissement` retourne `501 { error: "NOT_IMPLEMENTED" }` : il
n'existe aucun modèle `Arrondissement` en base (ni sur `Structure` ni sur
`Departement`). Le paramètre est déjà validé côté schéma pour que le front
puisse proposer l'option dans l'UI.

## Réutilisation du calcul existant

Une requête ne demande qu'**un seul indicateur à la fois**, avec son propre
mode d'agrégation (`aggregation`, moyenne/médiane) et ses propres filtres.
`cartographie.util.ts` ne rappelle donc jamais les fonctions "gros bloc" de
`/api/statistiques` (`computeStructuresStatistiques`,
`computePlacesStatistiques`, `computeFinanceStatistiques`,
`computeControleQualiteStatistiques`, `computeActiviteStatistiques`), qui
calculent systématiquement _tous_ les indicateurs d'un bloc (types de
structure, bâti, 3 scopes finance, séries mois/trimestre/année...) même quand
un seul champ est demandé. À la place, chaque `*.util.ts` exporte une fonction
ciblée qui ne calcule qu'un champ, pour une seule année (ex.
`computeStructuresIndicatorForYear`, `computeTypologieFieldForYear`,
`computeFinanceTotalValuesForYears`, `computeControleQualiteByYear`,
`computeActiviteSummary`), utilisée par le registre `INDICATEUR_COMPUTERS`
dans `cartographie.util.ts`.

Ce qui est réutilisé sans recalcul, en revanche, c'est le `StatistiquesContext`
déjà chargé par `buildStatistiquesContext` : on le "slice"
(`sliceStatistiquesContext` dans `../statistiques.utils.ts`) pour restreindre
`structures`/`allStructures`/`activeStructureIdsNow`/`activeStructureIdsByPeriod`/
`departements` aux structures d'une zone, puis on appelle la fonction ciblée
de l'indicateur demandé sur ce contexte restreint. Les autres champs du
contexte (typologies, adresses, budgets, eigs, évaluations, activités, liens
DNA/CPOM) n'ont pas besoin d'être tranchés : tous les modules de calcul
dérivent leur périmètre via les 5 champs ci-dessus plutôt que de filtrer ces
tableaux directement.

Une zone sans structure dans le périmètre (ex. département sans CAES si le
filtre `types=CAES`) est tout de même retournée, avec `value: null` et
`evolution: null`.

## Catalogue des indicateurs

| Clé                                            | Source                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `structures.total`                             | `structures.byYear[].totalStructures`                                          |
| `structures.avecCpom`                          | `structures.byYear[].structuresAvecCpom`                                       |
| `places.autorisees`                            | `places.byYear[].totalPlaces`                                                  |
| `places.pmr` / `places.lgbt` / `places.fvvTeh` | `places.byYear[].{pmr,lgbt,fvvTeh}`                                            |
| `places.qpv` / `places.logementsSociaux`       | `places.byYear[].{qpv,logementsSociaux}`                                       |
| `finance.dotationAccordee`                     | `finance.byYear[].total.dotationAccordee`                                      |
| `finance.etp`                                  | `finance.byYear[].total.totalETP`                                              |
| `finance.tauxEncadrement`                      | `finance.byYear[].total.tauxEncadrement` (ratio)                               |
| `finance.coutJournalier`                       | `finance.byYear[].total.coutJournalier` (ratio)                                |
| `finance.resultatNet`                          | `finance.byYear[].total.resultatNet` (signé - remonte "excédents et déficits") |
| `controleQualite.nbEig`                        | `controleQualite.byYear[].nbEig`                                               |
| `controleQualite.tauxEigComportementViolent`   | `controleQualite.byYear[].tauxEigComportementViolent` (ratio)                  |
| `controleQualite.moyenneEvaluations`           | `controleQualite.byYear[].noteGenerale` (ratio)                                |
| `activite.placesDna`                           | `activite.summary.placesEnregistreesDna`                                       |
| `activite.placesIndisponibles`                 | `activite.summary.placesIndisponibles`                                         |
| `activite.placesOccupees`                      | `activite.summary.placesOccupees`                                              |
| `activite.presencesIndues`                     | `activite.summary.presencesInduesTotal`                                        |

Le scope finance utilisé est toujours `total` (le filtre `types` structure
existant restreint déjà le périmètre, pas besoin d'un scope
autorisées/subventionnées supplémentaire).

Pour les ratios (taux d'encadrement, coût journalier, % EIG comportement
violent, moyenne aux évaluations), la valeur d'une **région** est recalculée à
partir des données brutes de tous ses départements (même logique que le calcul
global, restreint à la région) - ce n'est **pas** une moyenne des ratios
départementaux.

## TODO - évolution N-1 pour le bloc Activité

Le bloc `activite` n'a aujourd'hui aucune agrégation par année civile (pas de
`byYear`, seulement un instantané glissant `summary` et un `byMonth`). Les 4
indicateurs `activite.*` de la cartographie retournent donc la valeur de cet
instantané (identique quelle que soit l'`annee` demandée) avec
`evolution: null` - l'année demandée n'a pas d'effet sur ces 4 indicateurs tant
que ce point n'est pas tranché. À lever une fois la formule d'agrégation
annuelle confirmée.
