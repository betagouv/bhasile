# Statistiques — onglet Activité

Hypothèses de calcul pour l’API `GET /api/statistiques` (bloc `activite`).

## Périmètre

- Même périmètre de structures que les autres onglets (filtres URL `departements`, `operateurs`, `types`).
- Données `Activite` liées au périmètre via `dnaCode` → `DnaStructure`.
- **TODO(fermeture)** : exclusion des structures fermées (pas encore implémentée).
- **TODO(actualisation)** : `updatedAt` quand les formulaires d’actualisation seront disponibles.

## Données sources

- Table `Activite` (OFII / Démarches Numériques), une ligne par `dnaCode` et par mois (`date`).

## Scopes par indicateur

| Indicateur | Structures incluses |
|------------|---------------------|
| `placesEnregistreesDna` | Toutes les structures du périmètre |
| Indisponibilités | Toutes **sauf CAES** (CADA, CPH, HUDA) |
| Présences indues (BPI, déboutées, total) | **CAES et CPH** uniquement |

Un `dnaCode` est rattaché au scope si au moins une structure liée du périmètre correspond au type attendu.

## Séries `byMonth`

Une entrée par mois présent dans les activités du périmètre. Le choix du mois affiché se fait côté front.

| Champ | Calcul |
|-------|--------|
| `placesEnregistreesDna` | Somme des `placesAutorisees` (toutes structures) |
| `placesIndisponibles` | Somme des `placesIndisponibles` (hors CAES) |
| `tauxIndisponibilite` | `placesIndisponibles / placesAutorisees` du scope indispo |
| `presencesInduesBPI` | Somme des `presencesInduesBPI` (CAES + CPH) |
| `tauxPresencesInduesBPI` | `presencesInduesBPI / placesAutorisees` du scope présences indues |
| `presencesInduesDeboutees` | Somme des `presencesInduesDeboutees` (CAES + CPH) |
| `tauxPresencesInduesDeboutees` | `presencesInduesDeboutees / placesAutorisees` du scope présences indues |
| `presencesInduesTotal` | `presencesInduesBPI + presencesInduesDeboutees` |
| `tauxPresencesInduesTotal` | `presencesInduesTotal / placesAutorisees` du scope présences indues |

Les taux sont des ratios (0–1), `null` si le dénominateur est nul.

## Paramètres API

```
GET /api/statistiques?departements=75
```
