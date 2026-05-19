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
  - [Option D - Millésime partiel à chaque update](#option-d---millésime-partiel-à-chaque-update)
    - [Principe](#principe-3)
    - [Avantages](#avantages-3)
    - [Inconvénients](#inconvénients-3)
  - [Option E - Application différée par cron](#option-e---application-différée-par-cron)
    - [Principe](#principe-4)
    - [Avantages](#avantages-4)
    - [Inconvénients](#inconvénients-4)
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

## Option D - Millésime partiel à chaque update

### Principe

À chaque modification (hors brouillon transfo), on crée un nouveau **`StructureMillesime`** à la date du changement, mais on ne persiste que **le périmètre envoyé par le client** dans le `PUT` / le formulaire — pas une copie systématique de toutes les tables liées.

**Aujourd'hui** (payload « large ») : si l'utilisateur ne modifie que le Finess, le body contient quand même contacts, adresses, typologies, etc. Le back recrée un millésime avec tout ce bloc → on duplique les contacts même sans changement métier, mais on ne touche pas au budget ni aux autres tables annualisées absentes du payload.

**À terme** (payload « delta ») : les formulaires ne renvoient que les entités modifiées ; le millésime ne contient que ces lignes + les champs scalaires mis à jour. Les tables non envoyées restent celles du **millésime précédent** à la lecture (fusion du dernier état connu par collection).

Même règles d'affichage que les autres options : `effectiveDate ≤ aujourd'hui` pour l'état courant ; millésime futur (ex. transfo validée) → bandeau.

### Avantages

- **Compromis** entre l'option A (tout dupliquer) et B/C : historique par jalons sans copier 15 tables à chaque fois si le client n'envoie pas tout.
- **Aligné avec l'existant** : les `PUT` structure envoient déjà un arbre partiel ; pas de refonte copy-on-write immédiate.
- **Évolutif** : en resserrant les payloads, on réduit le volume sans changer le modèle de données.
- Les tables **annualisées** (budget, indicateurs) peuvent rester hors millésime tant qu'elles ne sont pas dans le body.

### Inconvénients

- **Lecture plus complexe** qu'en option A : pour afficher la fiche, il faut **recomposer** l'état (dernier millésime passé + pour chaque collection, dernier millésime qui a porté une ligne sur cette table — ou héritage explicite du millésime N-1).
- **Millésimes « incomplets »** en base : ambiguïté si on oublie d'envoyer une collection (bug ou régression → données qui semblent disparaître).
- Tant que les formulaires envoient tout le bloc identification / contacts, on garde une partie du **sur-duplication** de l'option A.
- **Validation transfo** : à définir (snapshot complet depuis `StructureTransformation` à la validation, ou même logique partielle).
- Tests et seeds plus difficiles qu'avec « un millésime = photo complète ».

---

## Option E - Application différée par cron

### Principe

Les données **futures** restent dans **`Transformation`** + **`StructureTransformation`** (figées à la validation via `Form`). La structure courante **n’obtient pas** de millésime à la date de validation : elle continue d’afficher le dernier état passé jusqu’à la **`StructureTransformation.date`**.

Un **cron** (ex. quotidien) sélectionne les transfo validées dont la date d’effet est atteinte et **matérialise** alors les changements sur la structure : création du `StructureMillesime`, copie des collections, mise à jour DNA, etc. — selon les règles retenues (souvent proche de l’option A au moment du passage).

Entre validation et date d’effet : bandeau « changement prévu » ; pas de double vérité sur la fiche structure (seule la transfo porte l’état futur).

### Avantages

- **Pas de millésime futur** à gérer en lecture : la fiche structure reste simple tant que la date n’est pas passée.
- **Aligné** avec l’idée déjà évoquée dans les commentaires du schéma transfo (application à échéance).
- Moins de risque d’**écraser** la structure trop tôt si la date est dans trois mois.
- Peut se **combiner** avec A ou D au moment du cron (le job fait le snapshot complet ou partiel une fois pour toutes).

### Inconvénients

- **Dépendance opérationnelle** : si le cron ne tourne pas ou rate un jour, les structures sont en retard → alerte / monitoring obligatoires.
- **Pas de rollback trivial** après application (écrasement ou nouveau millésime sans annulation automatique).
- **Fenêtre de lecture** : entre 00h00 et l’exécution du cron le jour J, l’état affiché peut encore être l’ancien (décalage d’un jour selon l’heure de passage).
- **Historique** : la transfo figée + le millésime créé le jour J ; bien documenter la traçabilité (`transformationId` sur le millésime).
- Complexité **batch** (ordre des transfo, plusieurs structures, plusieurs transfo le même jour) à cadrer dans le job.
- Ne remplace pas le besoin d’un modèle de millésime pour les **modifs hors transfo** (il faut quand même A, B ou D pour le quotidien).

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
