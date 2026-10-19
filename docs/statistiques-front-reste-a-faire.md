# Statistiques : reste à faire côté front

État au 14/10/2026, après rebase de `improve-stats` sur `fix-stats-back`. Le front compile contre le nouveau back ; les points ci-dessous ne sont pas encore branchés. Règles de calcul : [README de l'API](../src/app/api/statistiques/README.md). Retours à faire sur la maquette : [statistiques-retours-maquette.md](./statistiques-retours-maquette.md).

## Structures

- **Camemberts « en 2026 »** (`TypeChartPresenter`) : lire `structures.byYear` de l'année affichée (`structureTypes`, `structureBatis`, `totalStructures`) au lieu de la vue globale, avec le symbole de cette année. Prendre l'année dans les données plutôt que `new Date().getFullYear()`.
- **Tableau** : déjà branché sur `structureTypes` / `structureBatis` par année.

## Types de places

- **Jauges « En 2026 »** : PMR, LGBT et FVV-TEH depuis `places.byYear` de l'année affichée, avec son symbole. QPV et logements sociaux restent sur la vue globale (`places.qpv`, `places.logementsSociaux`, pas d'historique) et sortent du groupe « En 2026 », sans symbole.

## Finance

- **Encarts** : le titre affiche `DOCUMENTS_FINANCIERS_OPEN_YEAR` alors que les valeurs viennent de la dernière année de `finance.byYear`. Aligner les deux sur la même année et utiliser son `total.completude`.
- **Libellés des encarts** : le coût affiché est `coutJournalierTheorique` (dotation accordée / jours x places), le taux est `tauxEncadrementTheoriquePrevisionnel` : « coût place journalier prévisionnel » et « taux d'encadrement prévisionnel » sont à remplacer par « théorique ».
- **Excédents et déficits** (`BalanceChart`) : le graphique inclut maintenant l'année en cours, à zéro. Revenir à l'exclusion de l'année en cours (la maquette s'arrête à l'année précédente).
- **Budgets des structures sous CPOM** : le budget global du CPOM est compté en entier, même si le filtre ne retient qu'une partie de ses structures. Infobulle à prévoir sur l'encart, les graphiques et le tableau.

## Activité

- **Camembert d'indisponibilité** : ajouter une part « places CAES » (`activite.summary.placesCaes`), avec une infobulle expliquant que l'indisponibilité n'est pas suivie pour les CAES. Total = disponibles + indisponibles + CAES.

## Cartographie

- **Dotation accordée et résultat net** : le budget global d'un CPOM est compté en entier dans chaque zone qui contient une de ses structures. Infobulle à prévoir sur ces deux indicateurs.

## Notes de bas de page

- **« Données au 31/12 de chaque année »** : vrai pour les places seulement ; le type et le bâti reflètent l'état actuel de la structure.
