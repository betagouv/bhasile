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
| `excedentCumule`                                                        | Cumul RN **positifs** par structure, puis somme |
| `deficitCumule`                                                         | Cumul \|RN négatifs\| par structure, puis somme |
| `soldeCumule`                                                           | `excedentCumule − deficitCumule`                |

Cumuls par scope, chronologiques, sur les années où le scope a des données.

## Sources

`Budget`, `IndicateurFinancier` (`REALISE` + `PREVISIONNEL` en repli).
