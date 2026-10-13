# Retours sur la maquette Statistiques

État au 13/10/2026. Un retour par ligne ; les règles de calcul sont dans le [README de l'API](../src/app/api/statistiques/README.md).

## Finance

- **Tableau, indicateurs** : il me semble qu'on avait tranché sur 7 lignes au lieu des 9 présentes : ETP prévisionnel, ETP réel, taux cible, taux théorique prévisionnel, taux théorique réel, coût cible, coût théorique.
- **"Nombre d'ETP cible"** : à retirer, la cible porte sur le taux d'encadrement (places par ETP), les ETP cible seraient un calcul un peu hasardeux je pense et on n'en a pas parlé.
- **"Coût prévisionnel" / "Coût réel"** : un seul coût théorique (dotation accordée / jours x places).
- **Colonne 2026 du tableau** : afficher les valeurs prévisionnelles, comme les encarts au-dessus.
- **Symbole de fraîcheur** : sur 2024, 2025 et 2026, avec un score propre à chaque onglet (Total, Autorisées, Subventionnées). 2024 est inclus ici et pas dans les autres blocs, car le réalisé 2024 (ETP réalisé, résultat, dotations) n'est demandé qu'à l'actualisation 2026 : seules les structures actualisées l'ont saisi.
- **Montants des structures sous CPOM** : pour une structure sous CPOM, c'est le budget global du CPOM qui est compté, en entier, même si le filtre ne retient qu'une partie de ses structures (comme pour "CPOM complets ou partiels"). Les dotations, produits et charges peuvent donc dépasser le périmètre filtré : prévoir une infobulle sur l'encart, les graphiques et le tableau.

## Structures

- **Camembert des types** : retirer la part PRAHDA qui ne sont plus dans l'app.
- **Symbole de fraîcheur** : sur 2025 et 2026.

## Types de places

- **Tableau, QPV et logements sociaux** : une seule valeur à date, pas de colonne par année, pas d'historique.
- **Jauges "En 2026"** : sortir QPV et logements sociaux du groupe, ils portent sur toutes les structures actives.
- **Symbole de fraîcheur** : sur 2025 et 2026, pas seulement 2026.

## Contrôle qualité

- **Note des évaluations** : "/ 4" partout (l'encart affiche "/ 5").
- **Encart "évaluations menées en 2026"** : on a acté que la moyenne porte sur les 12 derniers mois, le libellé est à modifier.

## Activité

- **Camembert d'indisponibilité** : ajouter une part "places CAES" (ni disponibles ni indisponibles, l'indisponibilité n'est pas suivie pour les CAES). Infobulle pour expliquer ? Sinon l'ensemble des parts ne revient pas au total.

## Notes de bas de page

- **Astérisque 2021 à 2024** : "Les structures fermées avant le lancement de l'outil en 2024 ne figurent pas dans ces données."
- **"Données au 31/12 de chaque année"** : c'est vrai pour les places seulement, le type et le bâti sont sur l'état actuel.
