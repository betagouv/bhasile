# Versionnage des champs d'une structure (StructureMillesime / StructureTimestamp)

Document de réflexion sur la modélisation de l'état d'une structure dans le temps, en lien avec les **transformations** et les actualisations à venir.

- [Versionnage des champs d'une structure (StructureMillesime / StructureTimestamp)](#versionnage-des-champs-dune-structure-structuremillesime--structuretimestamp)
  - [Contexte](#contexte)
  - [Règles métier retenues](#règles-métier-retenues)
  - [Option A - Millésime complet à chaque version](#option-a---millésime-complet-à-chaque-version)
    - [Principe](#principe)
    - [Avantages](#avantages)
    - [Inconvénients](#inconvénients)
  - [Option B - Rolling timestamp + opérations futures](#option-b---rolling-timestamp--opérations-futures)
    - [Principe](#principe-1)
    - [Avantages](#avantages-1)
    - [Inconvénients](#inconvénients-1)
  - [Option C - Table de passage (copy-on-write / liens)](#option-c---table-de-passage-copy-on-write--liens)
    - [Principe](#principe-2)
    - [Avantages](#avantages-2)
    - [Inconvénients](#inconvénients-2)
  - [Tables concernées - checklist](#tables-concernées---checklist)
    - [Coquille `Structure`](#coquille-structure)
    - [Conteneur de version](#conteneur-de-version)
    - [Tables métier - liées à `Structure` aujourd’hui](#tables-métier---liées-à-structure-aujourdhui)
    - [Tables métier - cas particuliers](#tables-métier---cas-particuliers)
      - [Données déjà annualisées](#données-déjà-annualisées)
      - [CPOM](#cpom)
      - [StructureDna](#structuredna)
    - [Reporting (vues SQL)](#reporting-vues-sql)
    - [Non concerné par le chantier](#non-concerné-par-le-chantier)
      - [DNA et données rattachées au code DNA (indirect)](#dna-et-données-rattachées-au-code-dna-indirect)
    - [Tables non concernées a priori, plus "intéropérables"](#tables-non-concernées-a-priori-plus-intéropérables)
    - [Fichiers](#fichiers)
  - [Questions ouvertes](#questions-ouvertes)
  - [Prochaines étapes](#prochaines-étapes)

## Contexte

La question se pose initialement dans le cadre des transformations : on veut pouvoir dans le cadre de ces transfos modifier un certain nombre de champs et tables de la structure avec une prise d'effet ultérieure (à date de transformation). Cela entraîne alors une réflexion globale sur la manière de gérer ces évolutions.

Une structure peut en réalité évoluer pour plusieurs raisons :

- **Transformation** validée (fermeture, extension, transfert de places entre structures, etc.) à une date d'effet potentiellement **future** ;
- **Modification courante** (fiche structure, campagne d'actualisation, correction opérateur…) ;
- **Campagne d'actualisation** selon une logique à venir, à des moments spécifiques de l'année.

Hitsoriquement, beaucoup de données sont rattachées directement à `Structure`, avec des millésimes partiels (`StructureMillesime`, `StructureTypologie` par **année**).

Objectif : **`Structure` = coquille stable** (id intéropérable et code Bhasile essentiellement) ; **état métier variable = version datée**.

## Règles métier retenues

- **Brouillon transfo ou actualisation** : Les données ne vivent que dans `Transformation` + `StructureTransformation` (et leurs enfants).
- **Validation transfo ou actualisation** : Gérée via le **`Form.status`** lié à la transformation (`Form.transformationId`, bouton « Finaliser »). Une fois validée, la transfo **ne bouge plus**.
- **Application structure** : À la validation : pour chaque `StructureTransformation`, création d'une version datée de `StructureMillesime` sur la structure à `StructureTransformation.date`.
- **Affichage** : Dernier millésime / timestamp avec `effectiveDate ≤ date du jour`. Si version future existante on affiche un bandeau sur la fiche.
- **Résolution** : Gérée en back

---

## Option A - Millésime complet à chaque version

### Principe

Chaque événement qui « fige » un nouvel état crée un **`StructureMillesime`** (ou `StructureTimestamp`) avec une **`effectiveDate`**, et **duplique toutes les lignes** des tables liées (contacts, adresses, typologies, budgets…).

Deux déclencheurs typiques :

1. **Validation d'une transformation ou actualisation** -> nouveau millésime à la date d'effet (passée ou future).
2. **Modification hors transfo** -> nouveau millésime à date + copie intégrale.

Tant que `effectiveDate > now`, l'app n'applique pas cet état à l'affichage courant ; la fiche utilise le dernier millésime passé.

### Avantages

- Modèle **simple à expliquer** : un millésime = photo complète à la date D.
- Requêtes **simples** : sans résolution de graphe.
- **Historique fidèle** : on peut toujours reconstituer l'état à une date (si on a gardé les millésimes).
- Aligné avec la validation transfo (copie depuis `StructureTransformation` vers un millésime structure).

### Inconvénients

- **Volume** : beaucoup de lignes recopiées sans changement (2 contacts identiques dupliqués n fois).
- Coût **écriture** à chaque petite modification (correction téléphone -> copie de tout).
- Niveau "db" la compréhension métier est peu satisfaisante, aucun sens de dupliquer des contacts n fois. Par ailleurs des contraintes d'uniticté (sur un code Finess par exemple) sont à gérer

---

## Option B - Rolling timestamp + opérations futures

### Principe

- **Un seul** état « courant » mutable (**rolling**), qui reflète la réalité aujourd'hui.
- Chaque structure a un `StructureMillesime` spécifique correspondant à ce rolling (flag ? absence de transformationId / actualisationId ?)
- Les **opérations futures** (transfo validée à date ultérieure) sont stockées à part ; tant qu'elles ne sont pas effectives, elles n'alimentent pas le rolling.
- Quand la date passe : par défaut l'app affiche l'opération, si l'utilisateur modifie ça vient modifier le rolling détcté
- Option de **conserver** certains jalons (transfo, campagne) comme millésimes nommés.

Les tables liées pointent soit vers le rolling, soit vers des structures « pending » / `FutureStructureVersion`.

### Avantages

- **Léger** au quotidien : une correction ne duplique pas 15 tables.
- On conserve un historique léger sur des points d'étape nommés, et on est capable de gérer un "état du quotidien"

### Inconvénients

- **Historique un peu plus faible** si on écrase le rolling : impossible de répondre à « quelle était la fiche le 12 mars ? » sauf à revenir au dernier millésime explicite. Cependant cela ne semble pas être une demande métier

---

## Option C - Table de passage (copy-on-write / liens)

### Principe

Les entités métier (**Contact**, **Adresse**…) restent des lignes identifiées ; on crée une table de passage entre chaque Table et `StructureMillesime` la version datée ne duplique que des liens :

- `StructureMillesime` (effectiveDate, structureId, …)
- `ContactStructureMillesime` (timestampId, contactId, …)

**Règle copy-on-write** :

- Si le contact **ne change pas** entre millésime M1 et M2 -> **même** `contactId`, nouveau lien vers M2.
- Si le contact **change** -> nouvelle ligne `Contact` + lien vers M2.
- Même idée pour adresses, typologies, etc.

C'est un modèle de **versioning par entité**, pas par millésime global.

### Avantages

- **Stockage optimisé** : pas de duplication des entités inchangées.
- Historique **réel** des entités modifiées (chaîne de versions de Contact).
- Identité stable d'un contact « métier » possible (même personne au travers des différentes versions).

### Inconvénients

- **Complexité algorithmique** : actuellement l'update d'un champ vient actualiser l'intégralité de `Structure` et des tables liées, la modification est donc majeure et faire reprendre tous nos `PUT`.
- **Suppressions** difficiles (contact retiré à M2 : lien absent vs contact supprimé ?).
- **Collections** (liste de 12 adresses dont 1 seule change) : beaucoup de tables de passage.
- On mutliplie la cmplexité des requêtes prisma avec de nombreux structure.structureMillesime.structureMillesimeContact.contact : repositories et seeds **beaucoup** plus lourds à maintenir.

---

## Tables concernées - checklist

Voici la liste des tables concernées avec les questions restantes

### Coquille `Structure`

- **`Structure`** - identité stable :
  - `id`,
  - `codeBhasile`,
  - `filiale?` -> Modification à venir non liée à ce chantier
  - `createdAt` / `updatedAt`

### Conteneur de version

- **`StructureMillesime`** / **`StructureTimestamp`** - entité centrale
- `effectiveDate`,
- `structureId`,
- `transformationId?`,
- `actualisationId?`,
- **Champs scalaires aujourd’hui sur `Structure`** - à migrer dans le millésime :
  - `type`, `nom`, `public`
  - `operateurId` (à vérifier, si l'on souhaite que la structure puisse changer d'opérateur)
  - `adresseAdministrative`, `codePostalAdministratif`, `communeAdministrative`, `departementAdministratif`
  - `latitude`, `longitude`
  - `debutConvention`, `finConvention`, `creationDate`, `date303`, `debutPeriodeAutorisation`, `finPeriodeAutorisation` -> Déjà dépréciés via autre chantier pour passer par les dates des actes administratifs ?
  - `lgbt`, `fvvTeh` -> autre chantier possible : aligner le type avec typologie
  - `nomOfii`, `directionTerritoriale`, `notes`
  - `isArchived`

### Tables métier - liées à `Structure` aujourd’hui

- **`StructureMillesime`** -> compléter ave cles champs scalaires. Actuellement la table ne contient que les champs `cpom` et `operateurComment` qui doivent faire l'objet d'un récolement propre avec les Cpoms dédiés (voir que faire des commentaires, si possible avec la nouvelle table `Notes`)
- **`StructureTypologie`** -> passer le year actuel à un timestamp (mais voir si au fond ça a du sens côté métier)
- **`Contact`**
- **`Adresse`**
- **`AdresseTypologie`** - enfant de `Adresse` (places, QPV, logement social ; aujourd’hui par `year`) -> Réfléchir à comment gérer cela ?
- **`Antenne`**
- **`Finess`** - gérer les `unique` sur le code Finess
- **`DnaStructure`** - lien DNA ↔ structure (`startDate` / `endDate`)
- **`ActeAdministratif`** - actes rattachés structure (pas CPOM)
- **`DocumentFinancier`** - documents financiers structure

### Tables métier - cas particuliers

#### Données déjà annualisées

Veut-on les lier à un timestamp ou considère-t-on qu'en fait elles ont déjà leur échelle de temps et basta ? Y a-t-il un besoin dans le cadre strict des transformations par exemple ?

- **`Budget`** - budgets structure (hors budget CPOM pur)
- **`IndicateurFinancier`** - ETP, taux d’encadrement, coût journalier (par `year` + `type`)

Interrogations sur :

- **`StructureTypologie`** - déjà listée plus haut, mais clé `year` = campagne / déclaration, pas date de transfo ; à rattacher au millésime pour l’état « places à partir du… »
- **`AdresseTypologie`** - idem, par `year` sous chaque adresse du millésime actuellement. Si on duplique les `Adresse` doit-on aussi dupliquer toutes les `AdresseTypologie` associées ?
- **`DocumentFinancier`** - par `year` + catégorie
- **`ActeAdministratif`** - plutôt événementiel (`date`, `startDate`, `endDate`)

Deux échelles à ne pas mélanger : `effectiveDate` du millésime (« à partir de quand la fiche est ainsi ») vs `year` des données annualisées (« pour l’année N »). En transfo stricte, seuls typologies et DNA bougent souvent ; budget et indicateurs peuvent rester sur l’année en cours jusqu’à la campagne.

#### CPOM

Veut-on uniformiser le traitement avec le rattachement d'une structure à ses CPOM ? Ça me semble être l’occasion de traiter le rattachement DNA x CPOM comme un fait versionné dans le millésime, plutôt qu'en utilisant les `startDate` / `endDate`.

- **`CpomStructure`** - appartenance structure x CPOM (`dateStart` / `dateEnd`)
- **`CpomMillesime`** - millésime **CPOM** (pas structure) : hors périmètre

#### StructureDna

Veut-on uniformiser le traitement avec le rattachement d'une structure à ses DNA ? Idem, ça me semble être l’occasion de traiter le rattachement DNA x structure comme un fait versionné dans le millésime, plutôt qu'en utilisant les `startDate` / `endDate`.

- En **brouillon** : garder `DnaStructureTransformation` pour la saisie transfo.
- À la **validation** : copier la liste des `DnaStructure` prévue dans le nouveau millésime de chaque structure concernée (comme les contacts).
- **`startDate` / `endDate`** : on les déprécie au profit de l’`effectiveDate` du millésime où le lien apparaît ou disparaît.

### Reporting (vues SQL)

- **`ComparaisonPlaces`** (vue `reporting`)
- **`StructuresAggregates`** (vue `reporting`)
- **`StructuresFilling`** (vue `reporting`)

-> À adapter pour joindre le **dernier millésime passé** plutôt que `Structure` directement.

### Non concerné par le chantier

#### DNA et données rattachées au code DNA (indirect)

- **`Dna`** - référentiel hors périmètre (le lien change via `DnaStructure`)
- **`Activite`** - via `dnaCode`, pas `structureId`
- **`EvenementIndesirableGrave`** - via `dnaCode`

### Tables non concernées a priori, plus "intéropérables"

- **`Controle`** (+ **`FileUpload`** liés)
- **`Evaluation`** (+ **`FileUpload`** liés)
- **`Note`** (`userNotes`)

Tables moins en lien de toute façon avec Structure

- **`Form`** / **`FormStep`** / **`FormDefinition`** / **`FormStepDefinition`**
- **`Campaign`** - Inutilisée pour le moment de toute façon, usage à venir avec les actualisations ?
- **`UserAction`** / **`User`** / **`Role`** - référentiels auth

### Fichiers

- **`FileUpload`** - reste rattaché à l’entité parente (`ActeAdministratif`, `DocumentFinancier`, `Controle`, `Evaluation`) ; pas de FK directe structure (on remercie la refacto passée)

---

## Questions ouvertes

- [ ] Renommer `StructureMillesime` -> `StructureTimestamp` et passer de `year` à `effectiveDate` partout ?
- [ ] Valider qu'une structure ne peut pas avoir **plusieurs** millésimes le même jour (deux transfo) ? Gérer aussi le cas millésime manuel le jour d'une transfo
- [ ] `DnaStructure` : à intégrer pour remplacer `startDate` / `endDate` ?
- [ ] `CpomStructure` : à intégrer pour remplacer `startDate` / `endDate` ?
- [ ] Gestion des unique (Codes Finess par exemple)
- [ ] Exemple de **AdresseTypologie** (sous-adresse, par année/date) : graphe profond.

---

## Prochaines étapes

- [ ] Création d'une branche avec premeir changement de schéma hors transfo et d'un script de migration idempotent et PR sur dev puis main
- [ ] On joue le script idempotent une première fois, puis juste avant merge final
- [ ] Rebase de migration (qui contient notamment la partie de schema transformation)
- [ ] Fin de dev de la partie transfo sur migration, passage sur dev puis main
- [ ] On rejoue le script idempotent
- [ ] Cleaning des anciens liens entre `Structure` et ses différentes tables
