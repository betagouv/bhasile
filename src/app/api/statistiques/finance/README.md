# `finance`

## Millésimes

Toutes années avec budget (`Budget`, hors `isMissing`) ou indicateur réalisé (`IndicateurFinancier` `REALISE`, hors `isMissing`). Choix année = front.

## Scopes

| Scope            | Types             |
| ---------------- | ----------------- |
| `autorisees`     | CADA, CPH         |
| `subventionnees` | HUDA, CAES        |
| `total`          | Tout le périmètre |

## `byYear` (par scope)

| Champ                                                                               | Calcul                                          |
| ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| `dotationDemandee`, `dotationAccordee`, `totalProduits`, `totalCharges`, `totalETP` | Sommes                                          |
| `tauxEncadrement`, `coutJournalier`                                                 | Moyenne ou médiane                              |
| `resultatNet`                                                                       | `totalProduits − totalCharges` (agrégat scope)  |
| `excedentCumule`                                                                    | Cumul RN **positifs** par structure, puis somme |
| `deficitCumule`                                                                     | Cumul \|RN négatifs\| par structure, puis somme |
| `soldeCumule`                                                                       | `excedentCumule − deficitCumule`                |

Cumuls par scope, chronologiques. Année absente dans un scope -> report cumuls.

## Sources

`Budget`, `IndicateurFinancier` (`REALISE`).
