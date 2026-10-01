# Retours sur la maquette Statistiques

État au 01/10/2026. Écarts entre la maquette de la page Statistiques et les règles implémentées côté back (cf. [README de l'API](../src/app/api/statistiques/README.md)).

## Ce que la maquette doit corriger

Six points de la maquette affichent une donnée ou une règle qui ne correspond pas à ce qui a été décidé.

| Bloc                         | Ce que montre la maquette                                                | Ce qu'il faut afficher                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finance, tableau             | Neuf lignes : cible, prévisionnel et réel pour l'ETP, le taux et le coût | Sept lignes : ETP prévisionnel, ETP réel, taux cible, taux théorique prévisionnel, taux théorique réel, coût cible, coût théorique                  |
| Finance, tableau             | Une ligne « Nombre d'ETP cible »                                         | À retirer : la cible porte sur le taux d'encadrement (places par ETP), pas sur un nombre d'ETP                                                      |
| Finance, tableau             | « Coût prévisionnel » et « Coût réel »                                   | Un seul coût théorique : dotation accordée / (jours x places)                                                                                       |
| Types de places, tableau     | QPV et logements sociaux pour chaque année de 2022 à 2026                | Une seule valeur à date : il n'y a pas d'historique par année pour ces deux données                                                                 |
| Types de places, « En 2026 » | QPV et logements sociaux sous le symbole de score                        | À sortir du groupe « En 2026 » : ces deux jauges portent sur toutes les structures actives, pas sur les seules structures actualisées               |
| Types de places, tableau     | Symbole de score sur 2026 seulement                                      | Sur 2025 et 2026, comme dans le bloc Structures                                                                                                     |

Les libellés « prévisionnel » et « réel » du taux d'encadrement désignent désormais un taux recalculé (places / ETP saisi), plus le taux saisi par l'opérateur.

## Incohérences internes de la maquette

Quatre endroits où la maquette se contredit elle-même.

| Où                                      | Incohérence                                                                                         | Proposition                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Années portant le symbole de score      | 2025 et 2026 dans Structures, 2026 seul dans Types de places, 2024 à 2026 dans Finance              | Structures et Types de places : 2025 et 2026. Finance : 2024 à 2026, car le réalisé 2024 n'est demandé qu'à l'actualisation 2026              |
| Finance, colonne 2026 du tableau        | Vide pour l'ETP, le taux et le coût, alors que les encarts au-dessus affichent le prévisionnel 2026 | Afficher les valeurs prévisionnelles 2026 dans le tableau                                                                                     |
| Contrôle qualité, note des évaluations  | « 3,4 / 5 » dans l'encart, « / 4 » dans le tableau                                                  | « / 4 » partout : les notes vont de 1 à 4                                                                                                     |
| Structures, camembert des types         | Une part « PRAHDA » alors que l'assiette annonce un parc hors PRAHDA                                | Retirer PRAHDA : quatre types seulement (CADA, CPH, HUDA, CAES)                                                                               |

## Notes de bas de page et libellés à reformuler

Deux textes disent autre chose que ce que les chiffres représentent.

- **Astérisque des années 2021 à 2024.** La note dit que les structures fermées ces années-là ne sont pas comptabilisées « pour cette année ». En réalité elles manquent partout : l'outil a été lancé courant 2024, une structure fermée avant n'y a jamais été saisie. Formulation proposée : « Les structures fermées avant le lancement de l'outil en 2024 ne figurent pas dans ces données. »
- **« Les données correspondent au 31/12 de chaque année ».** C'est vrai pour les places. Le type de structure et le bâti reflètent l'état actuel de la structure pour toutes les années. La note est à limiter aux places, ou à compléter.

## Points d'attention

- **Taux d'équipement sur 2025 et 2026.** Il divise les places des seules structures actualisées par la population entière. Il reste donc très bas tant que la campagne n'est pas terminée.
- **Encart « moyenne aux évaluations menées en 2026 ».** Le back calcule aujourd'hui cette moyenne sur les 12 derniers mois, comme le taux d'EIG de l'encart voisin, et non sur l'année civile 2026.
