# Statistiques — onglet Contrôle qualité

Hypothèses de calcul pour l’API `GET /api/statistiques` (bloc `controleQualite`).

## Périmètre

- Même périmètre de structures que les autres onglets (filtres URL `departements`, `operateurs`, `types`).
- Structures retenues : celles ayant au moins une typologie (même règle que `places`).
- Places autorisées : somme des `placesAutorisees` (dernière valeur non nulle par structure).
- **TODO(fermeture)** : exclusion des structures fermées (pas encore implémentée).
- **TODO(actualisation)** : `updatedAt` quand les formulaires d’actualisation seront disponibles.

## Données sources

- **EIG** : table `EvenementIndesirableGrave`, liés au périmètre via `dnaCode` → `DnaStructure`.
- **Évaluations** : table `Evaluation`, filtrées par `structureId` du périmètre.

## Motif « comportement violent »

Détection par regex sur le champ `type` :

```
/comportement\s+violent/i
```

Helper partagé : `isEigComportementViolent` (`src/app/utils/eig.util.ts`).

## Vue globale `eig` (12 derniers mois glissants)

| Champ | Calcul |
|-------|--------|
| `tauxEig` | `nbEig / places autorisées` (ratio) |
| `nbEig` | Nombre d’EIG sur la période |
| `nbEigComportementViolent` | Parmi ces EIG, ceux dont le `type` correspond au motif violent |

Fenêtre : mois courant inclus, 12 mois en arrière (clé `YYYY-MM`).

## Séries `byMonth`

Une entrée par mois présent dans les EIG ou les évaluations du périmètre.

| Champ | Calcul |
|-------|--------|
| `nbStructuresSansDeclarationEig` | Structures du périmètre sans aucun EIG ce mois-là |
| `partStructuresSansDeclarationEig` | Ratio (0–1) de ces structures |
| `nbEig` | Nombre d’EIG du mois |
| `nbEigComportementViolent` | EIG à motif violent |
| `tauxEigComportementViolent` | `nbEigComportementViolent / nbEig` |
| `nbStructuresEvaluees` | Structures distinctes ayant au moins une évaluation ce mois |
| `noteGenerale` | Moyenne ou médiane des `note` (selon `aggregation`) |
| `notePersonne` | Moyenne ou médiane des `notePersonne` |
| `notePro` | Moyenne ou médiane des `notePro` |
| `noteStructure` | Moyenne ou médiane des `noteStructure` |

Le choix du mois affiché en tableau de bord se fait côté front à partir de `byMonth`.

## Agrégation moyenne / médiane

Paramètre URL `?aggregation=` (partagé avec finance) :

| Valeur | Effet |
|--------|-------|
| `moyenne` (défaut) | Moyenne arithmétique |
| `mediane` | Médiane |

S’applique aux champs `note*` de `byMonth`. Exposé dans `controleQualite.aggregation`.

## Paramètres API

```
GET /api/statistiques?aggregation=mediane&departements=75
```
