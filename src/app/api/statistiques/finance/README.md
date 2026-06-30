# `finance`

## TODO (hors transfo)

Valider le comportement fallback de `REALISE` vers `PREVISIONNEL`

## Millésimes

Union des années présentes dans `Budget` ou `IndicateurFinancier` (hors `isMissing`).

Le front choisit l'année affichée dans `byYear`.

## `byYear` (par scope)

Budgets et indicateurs sont agrégés **indépendamment** pour chaque année : structures actives du scope ayant respectivement un budget ou un indicateur sur l'année.

| Champ                                                                   | Calcul                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| `dotationDemandee`, `dotationAccordee`, `totalProduits`, `totalCharges` | Sommes (`Budget`, structures actives)           |
| `totalETP`                                                              | Somme (indicateurs résolus, structures actives) |
| `tauxEncadrement`, `coutJournalier`                                     | Moyenne ou médiane (indicateurs résolus)        |
| `resultatNet`                                                           | `totalProduits − totalCharges` (agrégat scope)  |
| `excedentCumule`                                                        | Somme des RN **positifs** par structure sur l'année |
| `deficitCumule`                                                         | Somme des \|RN négatifs\| par structure sur l'année |
| `soldeCumule`                                                           | `excedentCumule − deficitCumule` sur l'année        |

Par scope et par année (pas de cumul multi-années). Année absente dans un scope -> zéros.

## Indicateurs financiers (`ETP`, `tauxEncadrement`, `coutJournalier`)

Par structure et par année, **par champ** :

1. valeur `REALISE` si renseignée ;
2. sinon repli `PREVISIONNEL`.

## Scopes

| Scope            | Types             |
| ---------------- | ----------------- |
| `autorisees`     | CADA, CPH         |
| `subventionnees` | HUDA, CAES        |
| `total`          | Tout le périmètre |

## Sources

`Budget`, `IndicateurFinancier` (`REALISE` + `PREVISIONNEL` en repli).
