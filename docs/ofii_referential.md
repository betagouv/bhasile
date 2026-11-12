# Référentiel OFII : mise à jour mensuelle

Ce référentiel est alimenté à partir du fichier Excel mensuel fourni par l’OFII.

## 1. Import depuis le cockpit admin

Un super admin charge le fichier dans **Paramètres → Cockpit admin → Import OFII**.

1. **Simulation** : dès le choix du fichier, il est lu et chaque ligne est contrôlée, sans rien écrire. La page affiche la liste complète des lignes en erreur, ou, si le fichier est valide, ce que l’import va faire (structures créées, mises à jour, réactivées, passées inactives, activité enregistrée).
2. **Mois des données** : le mois détecté (nom de l’onglet ou du fichier) est proposé dans deux listes, mois et année, à vérifier, avec le dernier mois déjà importé. S’il n’a pas pu être déduit, l’utilisateur le saisit. Un mois antérieur au dernier import est refusé dans l’interface : les imports suivent l’ordre chronologique (réimporter le même mois reste possible).
3. **Confirmation** : le bouton « Confirmer l’import pour <mois> » reste désactivé tant qu’aucun mois valide n’est choisi. Le fichier est renvoyé avec le mois confirmé et revérifié par le serveur, puis le référentiel et l’activité sont écrits à ce mois, en une seule transaction.

Un fichier avec une seule ligne en erreur n’est pas importé du tout : on corrige le fichier, puis on le charge à nouveau.

Le code vit dans `src/app/api/ofii-imports/` : lecture du tableur (`ofii-xlsx.util.ts`), validation pure (`ofii-import.util.ts`), écritures Prisma (`ofii-import.repository.ts`).

### Ajouter un autre import au cockpit

Les briques communes à tous les imports de tableur sont déjà en place :

- **Service** : exposer `preview(file)` et `apply(file)`. `preview` n’écrit rien et renvoie un `ImportPreview` : `summary`, `changes` (ce que l’import fera, une phrase par ligne), `errors`, et pour les imports mensuels `detectedMonth` et `latestImportedMonth`. `apply` appelle `assertImportable(errors)` (qui lève une `ImportRejectedError` portant le détail), écrit, puis renvoie `{ summary }`. Types dans `src/types/import.type.ts`.
- **Routes** : `export const POST = cockpitImportRoute(preview)` dans `<import>/preview/route.ts`, et `cockpitImportRoute(apply)` dans `<import>/route.ts`. La fabrique vérifie l'accès au cockpit et lit le fichier envoyé. Déclarer les deux routes dans `src/proxy/auth-config.ts`.
- **Page** : `<SpreadsheetImport endpoint="/api/<import>" label="…" intro="…" />` dans le groupe `(fonctionnalites)` du cockpit (`exampleHref` pour un fichier d’exemple, `withMonth` si les données portent sur un seul mois), puis activer la tuile dans `cockpit-admin.features.ts`.

## 2. Secours : script Scalingo

Le script `scripts/recurring-scripts/ofii-fill-referential-and-activity.ts` applique le même traitement à un fichier déposé dans le bucket `DOCS_BUCKET_NAME`. Il affiche les lignes en erreur et n’écrit rien s’il y en a.

```bash
yarn script ofii-fill-referential-and-activity <clef_s3_du_fichier_xlsx> [AAAA-MM]
```

Le mois est facultatif : sans lui, le mois détecté dans le fichier est utilisé, et l’import échoue s’il n’y en a pas.

## 3. Comportement important

- **Onglet lu** : l’onglet `Liste` (format standard), le mois étant alors cherché dans le nom du fichier (ex. `09.26`). À défaut, l’unique onglet daté (ex. `octobre 2025`) ; un fichier avec plusieurs onglets datés est refusé. Le mois confirmé dans le cockpit prime sur le mois détecté.
- **Nom de structure (`Dna.nom`)** :
  - calculé via un _clean name_ (suppression des préfixes CADA/HUDA/…, opérateur, numéro de département, etc.),
  - le nom brut OFII est conservé dans `Dna.nomOfii`.
- **Département** :
  - le fichier OFII contient le **nom** (ex. `"Allier"`),
  - le **numéro** (ex. `"03"`) est résolu à partir de la table `Departement`, puis stocké dans `Dna.departementAdministratif`.
- **Opérateur** :
  - le libellé brut est mis en majuscules puis rapproché d’un opérateur par son `name` ou l’un de ses `ofiiNames`,
  - les `ofiiNames` priment sur les `name` : un libellé qui est aussi le nom d’un opérateur doublon en base est rattaché à l’opérateur qui le déclare en alias,
  - aucun opérateur n’est créé à l’import.
- **Structures absentes du fichier** : tout DNA encore actif (`inactiveInOfiiFileSince = null`) mais absent du fichier est marqué inactif à la date du fichier. C’est pourquoi un fichier sans aucune ligne est refusé.

## 4. Cas d’erreur fréquents

- **`opérateur « X » inconnu de Bhasile`** : le libellé ne correspond à aucun `name` ni `ofiiNames`. Ajouter le libellé aux `ofiiNames` de l’opérateur concerné, ou créer l’opérateur attendu.
- **`Le libellé OFII « X » est rattaché à deux opérateurs`** : l’import refuse de démarrer. Retirer le doublon des `ofiiNames` en base.
- **`département « X » inconnu`** : vérifier l’orthographe dans le fichier ou dans la table `Departement`. Les fautes connues sont corrigées dans `src/utils-server/departement-name.server.util.ts`.
- **Fichier illisible** (aucun onglet daté ni onglet `Liste`, en-têtes OFII absents) : vérifier que c’est bien le fichier OFII d’origine.
