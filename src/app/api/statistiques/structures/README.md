# Statistiques — onglet Structures

Hypothèses de calcul pour l’API `GET /api/statistiques` (bloc `structures`).

## Périmètre

- Structures retenues : celles qui passent les filtres URL (`departements`, `operateurs`, `types`).
- **TODO(fermeture)** : les structures avec fermeture effective seront exclues de tout le périmètre (pas encore implémenté).
- **TODO(actualisation)** : une date de mise à jour (`updatedAt`) sera exposée lorsque les formulaires d’actualisation permettront de la déterminer.

## Vue globale (sans millésime)

Objectif : aperçu exhaustif du parc filtré, même si toutes les structures ne sont pas renseignées au dernier millésime.

### `totalStructures`

- Nombre de structures du périmètre filtré.
- Inclut les structures sans typologie (contrairement aux répartitions par type / bâti).

### `totalCpoms`

- Nombre de CPOM **distincts** ayant au moins un lien `CpomStructure` actif **à la date du jour** avec une structure du périmètre.
- Actif : `dateStart` ≤ année courante ≤ `dateEnd` (bornes absentes = pas de contrainte de ce côté).
- Un CPOM peut être incomplet (ne couvre qu’une partie des structures du périmètre).

### `structuresAvecCpom`

- Nombre de structures du périmètre filtré rattachées à au moins un CPOM actif **à la date du jour** (même règle d’activité que ci-dessus).

### `structureTypes[]`

- Répartition par `Structure.type` (CADA, CAES, CPH, HUDA, PRAHDA, …).
- **Structures** : structures ayant au moins une ligne `StructureTypologie` et un `type` non nul.
- **Places** : somme des `placesAutorisees` issues, par structure, de la **dernière valeur non nulle** sur l’historique de typologies (millésime propre à chaque structure).
- Types sans structure : `structures: 0`, `places: 0`.

### `structureBatis[]`

- Répartition par type de bâti dérivé des adresses (`COLLECTIF`, `DIFFUS`, `MIXTE`) via `getRepartitionFromRepartitions`.
- **Structures** : mêmes structures actives que pour `structureTypes` (avec typologie).
- **Places** : mêmes `placesAutorisees` résolues que pour les types.
- Bâti absent sur une structure : défaut `COLLECTIF`.

### Résolution « dernière valeur non nulle » (`StructureTypologie`)

Pour chaque structure et chaque champ (`placesAutorisees`, `pmr`, `lgbt`, `fvvTeh`) : on parcourt les millésimes du plus récent au plus ancien et on prend la première valeur non `null`.

## Séries `byYear`

Une entrée par millésime présent dans `StructureTypologie` du périmètre.

### `totalStructures`

- Structures ayant une typologie **exactement** pour l’année (pas de résolution « dernière non nulle »).

### `totalCpoms`

- CPOM distincts actifs sur l’**année** considérée, avec au moins une structure du périmètre ayant une typologie pour cette année.
- Compte les CPOM complets ou partiels vis-à-vis du périmètre.

### `structuresCada`, `structuresCph`, `structuresHuda`, `structuresCaes`

- Nombre de structures (avec typologie pour l’année) par type.
- `structuresCph` = type `CPH` en base (libellé métier « CH »).

### `structuresBatiCollectif`, `structuresBatiDiffus`, `structuresBatiMixte`

- Nombre de structures (avec typologie pour l’année) par type de bâti.
- Pas de décompte de places en série annuelle.

## Données sources

| Champ API | Source |
|-----------|--------|
| Type structure | `Structure.type` (migration future : `StructureVersion`) |
| Places | `StructureTypologie.placesAutorisees` |
| Bâti | `Adresse.repartition` agrégée par structure |
| CPOM | `CpomStructure` (`cpomId`, `dateStart`, `dateEnd`) |
