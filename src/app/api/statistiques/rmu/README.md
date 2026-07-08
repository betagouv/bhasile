# `rmu`

Référés Mesures Utiles (RMU). Contrairement aux autres blocs, **la donnée est
directement au département** (`Rmu.departementNumero`), pas à la structure. Il
n'y a donc ni résolution DNA, ni pivot `StructureVersion`, ni notion de
structure active : on somme simplement les lignes `Rmu` du périmètre.

## Source

Table `Rmu` (schéma `public`), une ligne par **département × mois** (`date` = 1er
du mois à midi UTC). Alimentée mensuellement par `scripts/recurring-scripts/rmu-fill.ts`
depuis le XLSX « Suivi RMU ».

## Indicateurs exposés

Seuls les champs de la maquette sont remontés (la table en contient d'autres,
`deboutesSansMesureAdministrative` / `misesEnDemeure`, non exposés pour l'instant) :

| Champ            | Calcul                                                   |
| ---------------- | -------------------------------------------------------- |
| `referesEngages` | Somme des `referesEngages` de la période                 |
| `referesExecutes`| Somme des `referesExecutes` de la période                |
| `tauxExecute`    | `referesExecutes / referesEngages`, `null` si dénom. nul |

`tauxExecute` est un ratio 0-1 arrondi via `roundStatsRate` (passage en % côté front).

## Périmètre — `departements` seul, sinon `null`

La donnée étant départementale, elle ne se différencie pas par structure :

- `departements=75,92` (et aucun `operateurs`/`types`) → RMU des départements
  75 et 92 (`departements` absent = tout le parc).
- **Dès qu'un filtre `operateurs` ou `types` est actif** → le bloc `rmu` vaut
  **`null`** : on ne peut pas isoler un sous-ensemble de RMU par opérateur ou
  type. Le front affiche alors un message (« Les RMU ne sont pas différenciés
  par opérateur ou type »).

La décision est prise dans le service (`statistique.service.ts`) : on ne
requête `findRmus(resolvedFilters.departements)` que si `operateurs`/`types`
sont vides, sinon `context.rmus = null`. `computeRmuStatistiques` propage ce
`null` (à distinguer d'un périmètre sans donnée, qui rend des séries **vides**).

## `byMonth` / `byTrimester` / `byYear`

Même principe que le bloc `activite` (somme des valeurs **effectivement
déclarées**, sans inférence) étendu aux trois granularités pour coller au
sélecteur Mois / Trimestre / Année de la maquette :

- Une période sans aucune ligne RMU n'apparaît pas dans la série.
- Les taux sont **recalculés en back sur les totaux de la période**, jamais
  moyennés depuis les sous-périodes (`0,5` sur un trimestre, pas la moyenne des
  taux mensuels). Le front ne peut donc pas recombiner les périodes lui-même.
- Clé de période : `date` (1er jour du mois, du trimestre ou de l'année), format
  unifié identique à `controleQualite`.

## Limite connue (pas un TODO métier)

L'endpoint `/api/statistiques` renvoie `null` quand le périmètre **structures**
est vide (aucune structure finalisée non-PRAHDA). Dans ce cas le bloc RMU n'est
pas rendu non plus, même si des lignes `Rmu` existent pour ces départements. Le
périmètre RMU est aujourd'hui « emporté » par le socle commun ; à découpler si on
veut afficher le RMU indépendamment de la présence de structures.
