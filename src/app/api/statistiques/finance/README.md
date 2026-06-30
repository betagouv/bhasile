# `finance`

## TODO (hors transfo)

Valider le comportement fallback de `REALISE` vers `PREVISIONNEL`

## Millésimes

Années présentes dans `Budget` (hors `isMissing`).

Le front choisit l'année affichée dans `byYear`.

## Indicateurs financiers (`ETP`, `tauxEncadrement`, `coutJournalier`)

Par structure et par année, **par champ** :

1. valeur `REALISE` si renseignée ;
2. sinon repli `PREVISIONNEL`.

Puis agrégation scope : somme (`ETP`), moyenne ou médiane (taux).

## Scopes

| Scope            | Types             |
| ---------------- | ----------------- |
| `autorisees`     | CADA, CPH         |
| `subventionnees` | HUDA, CAES        |
| `total`          | Tout le périmètre |

## `byYear` (par scope)

| Champ                                                                   | Calcul                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| `dotationDemandee`, `dotationAccordee`, `totalProduits`, `totalCharges` | Sommes (`Budget`)                               |
| `totalETP`                                                              | Somme (indicateurs résolus)                     |
| `tauxEncadrement`, `coutJournalier`                                     | Moyenne ou médiane (indicateurs résolus)        |
| `resultatNet`                                                           | `totalProduits − totalCharges` (agrégat scope)  |
| `excedentCumule`                                                        | Somme des RN **positifs** par structure sur l'année |
| `deficitCumule`                                                         | Somme des \|RN négatifs\| par structure sur l'année |
| `soldeCumule`                                                           | `excedentCumule − deficitCumule` sur l'année        |

Par scope et par année (pas de cumul multi-années). Année absente dans un scope -> zéros.

## Sources

`Budget`, `IndicateurFinancier` (`REALISE` + `PREVISIONNEL` en repli).
