# Statistiques — onglet Finance

Hypothèses de calcul pour l’API `GET /api/statistiques` (bloc `finance`).

## Périmètre

- Même périmètre de structures que les autres onglets (filtres URL `departements`, `operateurs`, `types`).
- **TODO(fermeture)** : exclusion des structures fermées (pas encore implémentée).
- **TODO(actualisation)** : `updatedAt` quand les formulaires d’actualisation seront disponibles.

## Millésimes

- Une entrée par année présente dans les budgets (`Budget`, hors `isMissing`) ou les indicateurs réalisés (`IndicateurFinancier` type `REALISE`, hors `isMissing`) du périmètre.
- Le choix de l’année affichée en tableau de bord se fait côté front à partir de `finance.byYear`.

## Scopes (total / autorisées / subventionnées)

| Scope | Types de structure |
|-------|-------------------|
| `autorisees` | CADA, CPH |
| `subventionnees` | HUDA, CAES |
| `total` | Toutes les structures du périmètre |

## Données sources

- **Budgets** : table `Budget` (`isMissing` exclu), agrégés par année et scope.
- **Indicateurs** : table `IndicateurFinancier`, type `REALISE` uniquement, `isMissing` exclu.

## Agrégation moyenne / médiane

Paramètre URL `?aggregation=` :

| Valeur | Effet |
|--------|-------|
| `moyenne` (défaut) | Moyenne arithmétique |
| `mediane` | Médiane |

S’applique à `tauxEncadrement` et `coutJournalier` dans chaque entrée `byYear`, et aux notes d’évaluation dans `controleQualite.byMonth`. La valeur utilisée est exposée dans `finance.aggregation` et `controleQualite.aggregation`.

## Format des nombres en sortie API

- **Taux** (ratios 0–1 ou plus, ex. `tauxEquipement`, `tauxEig`, `tauxIndisponibilite`) : 3 décimales.
- **Indicateurs décimaux** (ex. `tauxEncadrement`, `coutJournalier`, `note*`, `totalETP`) : 1 décimale.
- **Comptages et montants agrégés** : valeur brute (entiers ou montants non arrondis).

## Séries `byYear`

Une entrée par année présente dans les budgets ou indicateurs du scope.

Par scope (`total`, `autorisees`, `subventionnees`) et par année :

| Champ | Calcul |
|-------|--------|
| `dotationDemandee` | Somme `Budget.dotationDemandee` |
| `dotationAccordee` | Somme `Budget.dotationAccordee` |
| `totalETP` | Somme des ETP |
| `tauxEncadrement` | Moyenne ou médiane des taux d’encadrement (selon `aggregation`) |
| `coutJournalier` | Moyenne ou médiane des coûts journaliers (selon `aggregation`) |
| `totalProduits` | Somme `Budget.totalProduits` |
| `totalCharges` | Somme `Budget.totalCharges` |
| `resultatNet` | `totalProduits − totalCharges` (agrégat du scope) |
| `excedentCumule` | Somme cumulée des résultats nets **positifs** de chaque structure du scope (un RN négatif n’y contribue pas) |
| `deficitCumule` | Somme cumulée des \|résultats nets négatifs\| de chaque structure du scope (un RN positif n’y contribue pas) |
| `soldeCumule` | `excedentCumule − deficitCumule` (= cumul des résultats nets de chaque structure) |

Les cumuls sont calculés **indépendamment** par scope, dans l’ordre chronologique des années.

## Paramètres API

```
GET /api/statistiques?aggregation=mediane&departements=75
```
