# Champs Budget - correspondance DB / UI

Ce document recense la correspondance entre les champs du modèle Prisma `Budget` et les labels affichés dans l'interface, selon le type de structure (tarifée ou subventionnée).
Il a pour ovjectif de clarifier les différences et de chercher à harmoniser le slabels afin d'éviter les erreurs associées.

## Rappel types de structures

- **Tarifée** : CADA, CPH
- **Subventionnée** : HUDA, CAES

## Tableau de correspondance

| Champ DB                            | Tarifée                                                                  | Subventionnée                                     | Notes                                                            |
| ----------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| `dotationDemandee`                  | "Dotation demandée"                                                      | "Dotation demandée"                               |                                                                  |
| `dotationAccordee`                  | "Dotation accordée"                                                      | "Dotation accordée"                               |                                                                  |
| `totalProduitsProposes`             | "Total produits proposé - dont dotation État"                            | _(absent)_                                        |                                                                  |
| `totalProduits`                     | "Total produits retenu - dont dotation État"                             | "Total produits retenu - dont dotation État"      | "retenu" absent du nom DB                                        |
| `totalChargesProposees`             | "Total charges proposé - par l'opérateur"                                | _(absent)_                                        |                                                                  |
| `totalCharges`                      | "Total charges retenu - par l'autorité tarifaire"                        | "Total charges retenu - par l'autorité tarifaire" | "retenu" absent du nom DB                                        |
| `resultatNet`                       | "Résultat net - par l'autorité tarifaire" / "Cumul des résultats" (CPOM) | "Résultat net"                                    | Calculé - voir ci-dessous                                        |
| `resultatNetProposeParOperateur`    | "Résultat net proposé - par l'opérateur"                                 | _(absent)_                                        | Calculé - voir ci-dessous                                        |
| `repriseEtat`                       | "Reprise par l'État" (tooltip)                                           | "Déficit compensé par l'État"                     | Sémantique différente selon le type                              |
| `excedentRecupere`                  | _(absent)_                                                               | "Excédent récupéré - en titre de recette"         |                                                                  |
| `excedentDeduit`                    | _(absent)_                                                               | "Excédent réemployé - dans la dotation à venir"   | "déduit" ≠ "réemployé"                                           |
| `fondsDedies`                       | _(absent)_                                                               | "Restant fonds dédiés"                            | "restant" absent du nom DB                                       |
| `affectationReservesFondsDedies`    | "Affectation - réserves & provision"                                     | _(absent)_                                        | "fondsDedies" <> "provision" dans le label                       |
| `reserveInvestissement`             | "Réserve - dédiée à l'investissement"                                    | _(absent)_                                        | Détail affectation (tarifée uniquement)                          |
| `chargesNonReconductibles`          | "Charges non reconductibles"                                             | _(absent)_                                        | Détail affectation                                               |
| `reserveCompensationDeficits`       | "Réserve de compensation - des déficits"                                 | _(absent)_                                        | Détail affectation                                               |
| `reserveCompensationBFR`            | "Réserve de couverture de BFR"                                           | _(absent)_                                        | Détail affectation - "compensation" ≠ "couverture" dans le label |
| `reserveCompensationAmortissements` | "Réserve de compensation - des amortissements"                           | _(absent)_                                        | Détail affectation                                               |
| `reportANouveau`                    | "Report à nouveau"                                                       | _(absent)_                                        | Détail affectation                                               |
| `autre`                             | "Autre"                                                                  | _(absent)_                                        | Détail affectation                                               |

## Champs calculés (non persistés en DB)

Ces champs n'existent pas dans le modèle Prisma. Ils sont calculés côté client via `src/app/utils/budget.util.ts` :

```
resultatNet                  = totalProduits - totalCharges
resultatNetProposeParOperateur = totalProduitsProposes - totalChargesProposees
```

## Écarts sémantiques notables

Je propose de renommer ces champs en DB afin de mieux coller

| Champ DB                         | Label UI                                      | Proposition                       |
| -------------------------------- | --------------------------------------------- | --------------------------------- |
| `excedentDeduit`                 | "Excédent réemployé"                          | `excedentReemploye`               |
| `repriseEtat`                    | "Déficit compensé par l'État" (subventionnée) | `deficitCompenseEtat`             |
| `reserveCompensationBFR`         | "Réserve de couverture de BFR"                | `reserveCouvertureBfr`            |
| `affectationReservesFondsDedies` | "Affectation réserves & provision"            | `affectationReservesEtProvisions` |
