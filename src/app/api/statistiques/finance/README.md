# `finance`

## Millésimes

Union des années présentes dans `Budget` (structures et CPOM) ou `IndicateurFinancier`.

Le front choisit l'année affichée dans `byYear`.

## `byYear` (par scope)

Structures comptabilisées sur l'année (cf. [README racine](../README.md#structures-comptabilisées-par-année)) appartenant au scope. Chaque scope porte son propre `completude` (structures du scope attendues et comptabilisées). Les années de campagne commencent un an plus tôt que dans les autres blocs (2024 avec la campagne 2026), cf. « Décalage finance » du README racine.

| Champ                                                                   | Calcul                                                                                   |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `dotationDemandee`, `dotationAccordee`, `totalProduits`, `totalCharges` | Sommes (`Budget`)                                                                        |
| `resultatNet`                                                           | `totalProduits - totalCharges` (agrégat scope) ; égal à `excedentCumule - deficitCumule` |
| `excedentCumule`                                                        | Somme des RN **positifs** par structure sur l'année                                      |
| `deficitCumule`                                                         | Valeur absolue de la somme des RN négatifs par structure sur l'année                     |
| `totalETPPrevisionnel`, `totalETPRealise`                               | Somme des ETP saisis (`IndicateurFinancier` `PREVISIONNEL` / `REALISE`), `null` si aucun |
| `tauxEncadrementTheoriquePrevisionnel`, `tauxEncadrementTheoriqueRealise` | Par structure : places moyennes de l'année / ETP (prévisionnel ou réalisé), puis moyenne ou médiane |
| `tauxEncadrementCible`                                                  | Par structure : cible de `reporting.taux_encadrement_cible`, puis moyenne ou médiane     |
| `coutJournalierTheorique`                                               | Par structure : dotation accordée / jours x places, puis moyenne ou médiane              |
| `coutJournalierCible`                                                   | Par structure : cible de `reporting.tarif_journalier_cible`, puis moyenne ou médiane     |

Par scope et par année (pas de cumul multi-années). Année absente dans un scope -> zéros pour les montants, `null` pour les indicateurs. Arrondi 1 décimale (`roundStatsNumber`).

## Budgets des structures sous CPOM

Chaque structure saisit son budget à son échelle, et chaque CPOM a en plus son budget global, une ligne par année et par type de structure. Pour ne pas compter deux fois (`buildBudgetEntries`) :

- une structure **sous CPOM sur l'année** (`isCpomLinkActiveInYear`, cf. [structures](../structures/README.md#cpom-actif)) est comptée via la ligne de budget du CPOM de son type, **à la place** de son propre budget ;
- le budget du CPOM est compté **une fois et en entier**, même si le périmètre ou le filtre sur les structures actualisées ne retient qu'une partie de ses structures (même logique que « CPOM complets ou partiels ») : les montants peuvent donc dépasser le périmètre filtré, à signaler par une infobulle ;
- sans ligne de budget CPOM pour l'année et le type, repli sur le budget de la structure ;
- `excedentCumule` / `deficitCumule` : un résultat par ligne de budget CPOM, un par structure hors CPOM ;
- le coût théorique reste calculé avec la dotation propre de chaque structure, puisqu'il se calcule structure par structure.

Les vues SQL de reporting (`scripts/views/002_structures_aggregate.sql`, `006_reporting_global.sql`) suivent le même principe pour la dotation du parc (budget du CPOM, sinon budget de la structure), avec trois différences : le CPOM y est « en cours » au jour près et non à l'année, le repli se déclenche si le CPOM n'a aucun budget toutes années confondues, et la dotation retenue est la dotation accordée, à défaut la demandée, du dernier millésime.

## Indicateurs généraux : choix retenus (octobre 2026) et raisons

- **Le taux d'encadrement et le coût journalier saisis par les opérateurs ne sont plus affichés.** Ils restent demandés dans les formulaires et stockés (`IndicateurFinancier.tauxEncadrement` / `coutJournalier`) : on récolte tout sur 2026 avant de décider de déprécier les champs. Les stats affichent à la place une valeur **théorique** recalculée et une **cible**.
- **ETP : seule donnée saisie conservée**, en deux valeurs distinctes (prévisionnel, réalisé) sans repli de l'une sur l'autre : le repli mélangeait deux états dans un même chiffre sans que l'agent puisse le voir.
- **Taux d'encadrement en places par ETP** (et non ETP par place) : même unité que la donnée saisie jusqu'ici et que les seuils d'anomalies (`TAUX_ENCADREMENT_*`). La cible est donc un taux, pas un nombre d'ETP : définie par type, année et zonage, elle ne peut pas dépendre de la taille de la structure.
- **Agrégation par structure, puis moyenne ou médiane** (paramètre `aggregation`), pour le théorique comme pour les cibles : théorique et cible restent comparables sur un périmètre qui mélange les types. Ce n'est pas un ratio des sommes du périmètre.

### Jours x places (`computeStructureJoursPlaces`)

Base commune au coût théorique (dénominateur) et au taux théorique (places moyennes = jours x places / jours) :

- bornés par l'ouverture et la fermeture de la structure dans l'année ;
- à partir de `PLACES_VERSIONED_FROM_YEAR`, les places suivent les `StructureVersion` : une transformation en cours d'année découpe l'année en segments ;
- avant, le millésime `StructureTypologie.placesAutorisees` vaut pour toute l'année ;
- l'année en cours est comptée **en entier** avec les versions effectives à ce jour, car la dotation accordée est annuelle ;
- dotation accordée absente ou nulle, ou places inconnues : pas de valeur pour la structure, elle n'entre pas dans la moyenne.

### Cibles

| Table                              | Clé                                                                 | Valeur                         |
| ---------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| `reporting.tarif_journalier_cible` | `structure_type`, `year`, `belongs_to_idf`                          | `tarif_cible` (€ / place / jour) |
| `reporting.taux_encadrement_cible` | `structure_type`, `year`, `belongs_to_idf`, `comes_from_huda`       | `taux_cible` (places par ETP)  |

- Remplissage manuel. Une combinaison absente de la table (notamment une année) donne une cible `null`, sans reprise de l'année précédente.
- `belongs_to_idf` : département administratif de la structure dans la région `FR-IDF`.
- `comes_from_huda` : CADA **créé** par une transformation HUDA vers CADA (`TRANSFO_HUDA_*_VERS_CADA_NOUVEAU`), dès sa création et sans limite de durée. Un CADA existant qui absorbe des places de HUDA garde la cible CADA classique : il reste majoritairement un CADA historique.
- Les tarifs saisis avant l'ajout de la colonne `year` ont été rattachés à 2026 par la migration.
- Les anomalies (`COUT_JOURNALIER_GT_TARIF_CIBLE`) lisent encore le tarif cible dans la variable d'environnement `TARIF_JOURNALIER_CIBLE`, pas dans cette table : alignement à faire.

## Cartographie

`computeFinanceTotalValuesForYears` n'expose qu'un état par indicateur : `etp` et `tauxEncadrement` prennent la valeur réalisée du périmètre, à défaut la prévisionnelle ; `coutJournalier` est le coût théorique.

## Calcul

Par année : `computeFinanceYearData` calcule une fois les budgets et les indicateurs par structure, puis `aggregateFinanceScope` les agrège pour chaque scope.

## Scopes

| Scope            | Types             |
| ---------------- | ----------------- |
| `autorisees`     | CADA, CPH         |
| `subventionnees` | HUDA, CAES        |
| `total`          | Tout le périmètre |

## Sources

`Budget` (structures et CPOM), `CpomStructure`, `IndicateurFinancier` (ETP), `StructureVersion` et `StructureTypologie` (places), `reporting.tarif_journalier_cible`, `reporting.taux_encadrement_cible`.
