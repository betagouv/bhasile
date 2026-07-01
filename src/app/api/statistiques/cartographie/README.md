# Cartographie des statistiques

`GET /api/statistiques/cartographie` retourne, pour un indicateur donné, une
valeur par zone (région ou département) avec son évolution par rapport à
l'année précédente. C'est le pendant "carte" de `GET /api/statistiques`
("tableaux & graphiques") : même périmètre de filtres, mais la réponse est une
liste de zones plutôt qu'un objet global.

## Paramètres

- `granularite` : `region` | `departement` | `arrondissement`
- `indicateur` : voir catalogue ci-dessous
- `annee` : année de référence (l'évolution compare à `annee - 1`)
- `departements`, `regions` : restriction de zone (CSV, indépendante de
  `granularite` - on peut restreindre à une région et découper par département
  pour zoomer dessus)
- `operateurs`, `types`, `aggregation` : identiques à `/api/statistiques`

`granularite=arrondissement` retourne `501 { error: "NOT_IMPLEMENTED" }` : aucun
modèle `Arrondissement` en base. Le paramètre est déjà validé côté schéma pour
que le front puisse proposer l'option dans l'UI.

## Calcul

Une requête calcule **un seul indicateur à la fois**, jamais les fonctions
"gros bloc" de `/api/statistiques` (`computeStructuresStatistiques` etc.), qui
calculent tout un bloc même quand un seul champ est demandé. Chaque
`*.util.ts` expose à la place une fonction ciblée à un champ/une année
(`computeStructuresIndicatorForYear`, `computeTypologieFieldForYear`,
`computeAdresseFieldForYear`, `computeFinanceTotalValuesForYears`,
`computeControleQualiteByYear`, `computeActiviteSummary`), référencées par le
registre `INDICATEUR_COMPUTERS` dans `cartographie.util.ts`.

Ce qui est réutilisé sans recalcul : le `StatistiquesContext` déjà chargé par
`buildStatistiquesContext`. `sliceStatistiquesContext` le restreint à une zone ;
les autres modules de calcul dérivent déjà leur périmètre depuis les champs
qu'elle tranche, pas besoin de filtrer le reste.

Ne pas confondre `aggregation` (moyenne/médiane, calcul des ratios) et
`granularite` (région/département, découpage géographique) : deux notions
différentes, noms proches.

Une zone sans structure dans le périmètre est incluse avec `value: null`.

## Catalogue des indicateurs

Chaque clé lit un champ de `StatistiqueApiRead` pour l'année demandée
(`byYear` pour structures/places/finance/contrôleQualite, instantané `summary`
pour activité — cf. TODO).

- **structures** : `total`, `avecCpom` (structures couvertes par un CPOM actif)
- **places** : `autorisees`, `pmr`, `lgbt`, `fvvTeh`, `qpv`, `logementsSociaux`
- **finance** (scope `total` uniquement, le filtre `types` structure suffit à
  restreindre) : `dotationAccordee`, `etp`, `tauxEncadrement` (ratio),
  `coutJournalier` (ratio), `resultatNet` (signé "excédents et déficits")
- **controleQualite** : `nbEig`, `tauxEigComportementViolent` (ratio),
  `moyenneEvaluations` (ratio)
- **activite** : `placesDna`, `placesIndisponibles`, `placesOccupees`,
  `presencesIndues`

Pour les ratios, la valeur d'une région est recalculée à partir des données
brutes de tous ses départements, jamais une moyenne des ratios départementaux.

## TODO — évolution N-1 pour le bloc Activité

Le bloc `activite` n'a aucune agrégation par année civile (instantané glissant
uniquement). Les 4 indicateurs `activite.*` retournent donc toujours la même
valeur quelle que soit `annee`, avec `evolution: null`. À lever une fois la
formule d'agrégation annuelle confirmée.
