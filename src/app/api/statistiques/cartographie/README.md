# Cartographie des statistiques

`GET /api/statistiques/cartographie` retourne, pour un indicateur donné, une valeur par zone (région ou département) avec son évolution par rapport à l'année précédente. C'est le pendant "carte" de `GET /api/statistiques` ("tableaux & graphiques") : même périmètre de filtres, mais la réponse est une liste de zones plutôt qu'un objet global.

## TODO

- [ ] Confirmer que la résolution région -> départements se fait
      bien côté client avant l'appel (le format de requête actuel repose sur cette hypothèse).
      Ca semble d'ailleurs discutable vu que l'on a du coup pour une région l'ensemble des départements qui sont "resommés" sur la région... Sans doute un impact sur les performances.

## Paramètres

- `granularite` : `region` | `departement` | `arrondissement`
- `indicateur` : voir catalogue ci-dessous
- `annee` : année de référence (l'évolution compare à `annee - 1`)
- `departements` : restriction de zone (numéros séparés par des virgules, indépendante de
  `granularite` — on peut restreindre à une poignée de départements et découper par région pour les regrouper, ou l'inverse). Comme partout ailleurs dans l'app (structures, `/api/statistiques`), le front résout une sélection de région en numéros de département avant l'appel réseau : pas de paramètre `regions` séparé.
- `operateurs`, `types`, `aggregation` : identiques à `/api/statistiques`

`granularite=arrondissement` retourne `501 { error: "NOT_IMPLEMENTED" }` : aucun modèle `Arrondissement` en base. Le paramètre est déjà validé côté schéma pour que le front puisse proposer l'option dans l'UI.

Tous les paramètres passent en query string. Une valeur invalide (`indicateur` ou `granularite` hors énum, `annee` non numérique) renvoie `400 { error: "INVALID_PARAMS" }` avec le détail des erreurs Zod.

## Exemple de requête

Bien entendu, s'assurer que le serveur est lancé si test en local

Places autorisées 2025 par région, restreint à l'Auvergne-Rhône-Alpes (le front a résolu la région en numéros de département avant l'appel) :

```
GET /api/statistiques/cartographie
  ?granularite=region
  &indicateur=places.autorisees
  &annee=2025
  &departements=01,03,07,15,26,38,42,43,63,69,73,74
  &aggregation=moyenne
```

Ou en curl

```bash
curl -G 'http://localhost:3000/api/statistiques/cartographie' \
  -H 'x-dev-auth-bypass: 1' \
  --data-urlencode 'granularite=region' \
  --data-urlencode 'indicateur=places.autorisees' \
  --data-urlencode 'annee=2025' \
  --data-urlencode 'departements=01,03,07,15,26,38,42,43,63,69,73,74' \
  --data-urlencode 'aggregation=moyenne'
```

Sans `departements`, toute la France ; sans aucun filtre opérateur/type.

## Forme de la réponse

```jsonc
{
  "granularite": "region",
  "indicateur": "places.autorisees",
  "annee": 2025,
  "zones": [
    {
      // numéro de département, ou code région (référentiel BDD) selon la granularité
      "code": "84",
      "name": "Auvergne-Rhône-Alpes",
      "value": 1234, // null si la zone n'a aucune structure / donnée pour l'année
      "evolution": {
        "previousValue": 1180,
        "delta": 54,
        "direction": "hausse", // "hausse" | "baisse" | "stable"
      },
    },
  ],
}
```

`evolution` vaut `null` dès que `value` **ou** `previousValue` est `null` (zone sans donnée sur l'une des deux années). Le type exact est `CartographieApiRead` dans `src/schemas/api/statistique-cartographie.schema.ts`.

## Calcul

Une requête calcule **un seul indicateur à la fois**, jamais les fonctions "gros bloc" de `/api/statistiques` (`computeStructuresStatistiques` etc.), qui calculent tout un bloc même quand un seul champ est demandé. Chaque `*.util.ts` expose à la place une fonction ciblée à un champ/une année (`computeStructuresIndicatorForYear`, `computeTypologieFieldForYear`, `computeAdresseFieldForYear`, `computeFinanceTotalValuesForYears`, `computeControleQualiteByYear`, `computeActiviteFieldForYears`), référencées par le registre `INDICATEURS` dans `cartographie.util.ts`.

Ce qui est réutilisé sans recalcul : le `StatistiquesContext` déjà chargé par `buildStatistiquesContext`. `sliceStatistiquesContext` le restreint à une zone ; les autres modules de calcul dérivent déjà leur périmètre depuis les champs qu'elle tranche, pas besoin de filtrer le reste.

Une zone sans structure dans le périmètre est incluse avec `value: null`.

## Catalogue des indicateurs

Chaque clé lit un champ de `StatistiqueApiRead` pour l'année demandée
(`byYear` pour structures/places/finance/contrôleQualite ; pour activité, la moyenne/médiane — selon `aggregation` — de la série mensuelle de l'année).

- **structures** : `total`, `avecCpom` (structures couvertes par un CPOM actif)
- **places** : `autorisees`, `pmr`, `lgbt`, `fvvTeh`, `qpv`, `logementsSociaux`
- **finance** : scope `total` uniquement, le filtre `types` structure suffit à
  restreindre, avec `dotationAccordee`, `etp`, `tauxEncadrement` (ratio),
  `coutJournalier` (ratio), `resultatNet` (signé "excédents et déficits").
- **controleQualite** : `nbEig`, `tauxEigComportementViolent` (ratio), `moyenneEvaluations` (ratio)
- **activite** : `placesDna`, `placesIndisponibles`, `placesOccupees`,
  `presencesIndues`. La valeur d'une année est la moyenne (ou médiane) de sa série mensuelle, et l'évolution compare à

Pour les ratios, la valeur d'une région est recalculée à partir des données brutes de tous ses départements, jamais une moyenne des ratios départementaux.

Pour tous les indicateurs, une année sans année précédente pour comparer a son indicateur d'évolution à null (il n'est pas inféré depuis une éventuelle année n-2).
