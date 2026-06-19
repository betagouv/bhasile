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
| `tauxEigComportementViolent` | `nbEigComportementViolent / nbEig` sur la même période |
| `moyenneEvaluationsCurrentYear` | Moyenne ou médiane des `note` des évaluations de `CURRENT_YEAR` (selon `aggregation`) |

Fenêtre EIG : mois courant inclus, 12 mois en arrière (clé `YYYY-MM`).

## Séries temporelles : `byMonth`, `byTrimester`, `byYear`

Trois granularités exposées avec **les mêmes indicateurs** et **la même logique de calcul**, appliquée sur l’ensemble des EIG et évaluations de la période concernée.

| Série | Clé de regroupement |
|-------|---------------------|
| `byMonth` | `YYYY-MM` (champ `date` = 1er du mois) |
| `byTrimester` | trimestre calendaire (`year` + `trimester` 1–4) |
| `byYear` | année calendaire (`year`) |

### Pourquoi trois séries côté API ?

Les moyennes et médianes de notes **ne sont pas additives** : on ne peut pas recomposer un trimestre ou une année en faisant la moyenne des moyennes mensuelles.

Exemple : 1 évaluation à 2/5 en janvier et 10 évaluations à 4/5 en février donnent une moyenne trimestrielle de `(2 + 10×4) / 11 ≈ 3,8`, pas la moyenne de `(2 + 4) / 2 = 3`.

Le front choisit donc directement la série adaptée à la fenêtre affichée (`byMonth`, `byTrimester` ou `byYear`) plutôt que d’agréger des points mensuels.

### Indicateurs par période

| Champ | Calcul |
|-------|--------|
| `nbStructuresSansDeclarationEig` | Structures du périmètre sans aucun EIG sur la période |
| `partStructuresSansDeclarationEig` | Ratio (0–1) de ces structures |
| `nbEig` | Nombre d’EIG de la période |
| `nbEigComportementViolent` | EIG à motif violent |
| `tauxEigComportementViolent` | `nbEigComportementViolent / nbEig` |
| `nbStructuresEvaluees` | Structures distinctes ayant au moins une évaluation sur la période |
| `noteGenerale` | Moyenne ou médiane des `note` de **toutes** les évaluations de la période |
| `notePersonne` | Moyenne ou médiane des `notePersonne` |
| `notePro` | Moyenne ou médiane des `notePro` |
| `noteStructure` | Moyenne ou médiane des `noteStructure` |

Les taux EIG sont aussi recalculés sur les totaux de la période (pas la moyenne des taux mensuels).

## Agrégation moyenne / médiane

Paramètre URL `?aggregation=` (partagé avec finance) :

| Valeur | Effet |
|--------|-------|
| `moyenne` (défaut) | Moyenne arithmétique |
| `mediane` | Médiane |

S’applique aux champs `note*` des séries temporelles et à `eig.moyenneEvaluationsCurrentYear`. Exposé dans `controleQualite.aggregation`.

## Paramètres API

```
GET /api/statistiques?aggregation=mediane&departements=75
```
