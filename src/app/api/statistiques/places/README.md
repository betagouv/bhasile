# Statistiques — onglet Places

Hypothèses de calcul pour l’API `GET /api/statistiques` (bloc `places`).

## Périmètre

- Même périmètre de structures que l’onglet Structures (filtres URL `departements`, `operateurs`, `types`).
- **TODO(fermeture)** : les structures avec fermeture effective seront exclues de tout le périmètre (pas encore implémenté).
- **TODO(actualisation)** : une date de mise à jour (`updatedAt`) sera exposée lorsque les formulaires d’actualisation permettront de la déterminer.

## Structures retenues pour les agrégats

- Structures ayant au moins une ligne `StructureTypologie` dans le périmètre (même règle que les répartitions « actives » de l’onglet Structures).
- Les structures sans typologie ne contribuent à aucun indicateur de places.

## Vue globale (sans millésime)

Objectif : aperçu exhaustif à partir de la **dernière valeur non nulle** par structure et par champ, même si les millésimes diffèrent d’une structure à l’autre.

### `totalPlaces`

- Somme des `placesAutorisees` résolues par structure (dernière valeur non nulle sur l’historique `StructureTypologie`).

### `population`, `tauxEquipement`

- Agrégat sur les départements du périmètre filtré (ceux des structures retenues, donc restreints par `departements` si le filtre URL est présent).
- `population` : somme des `Departement.population` de ces départements, ou `null` si au moins une population est absente.
- `tauxEquipement` : `totalPlaces / population`, ou `null` si `population` est absente.

### `pmr`, `lgbt`, `fvvTeh`

- Somme, par structure active, de la dernière valeur non nulle de chaque champ sur `StructureTypologie`.

### `qpv`, `logementsSociaux`

- Par adresse du périmètre : dernière `AdresseTypologie` connue (millésime le plus récent en base).
- Si aucune typologie d’adresse : repli sur les scalaires `Adresse.qpv` / `Adresse.logementSocial` (non `null` uniquement en repli implicite via `?? 0` sur scalaires).
- Somme sur toutes les adresses des structures actives.

## Séries `byYear`

Une entrée par millésime présent dans `StructureTypologie` du périmètre. Mêmes indicateurs que la vue globale, mais **sans** résolution « dernière non nulle » : tout est calculé sur le millésime exact.

### `totalPlaces`

- Somme des `placesAutorisees` des typologies structure pour l’année.

### `population`, `tauxEquipement`

- Même formule que le global, avec le `totalPlaces` du millésime exact.

### `pmr`, `lgbt`, `fvvTeh`

- Somme des valeurs `StructureTypologie` pour l’année (champ absent ou `null` → 0).

### `qpv`, `logementsSociaux`

- Somme des `AdresseTypologie` de l’année pour les adresses des structures actives sur ce millésime.

## Données sources

| Champ API | Source |
|-----------|--------|
| Places autorisées | `StructureTypologie.placesAutorisees` |
| PMR / LGBT / FVV-TEH | `StructureTypologie.pmr`, `.lgbt`, `.fvvTeh` |
| QPV / logements sociaux | `AdresseTypologie` (prioritaire) ou `Adresse` |
| Population | `Departement.population` |
| Département structure | `Structure.departementAdministratif` (futur : `StructureVersion`) |
