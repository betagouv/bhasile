# Référentiel OFII : mise à jour mensuelle

Ce référentiel est alimenté à partir du fichier Excel mensuel fourni par l’OFII.

## 1. Import depuis le cockpit admin

Un super admin charge le fichier dans **Paramètres → Cockpit admin → Import OFII**.

1. **Vérification** : dès le choix du fichier, il est lu et chaque ligne est contrôlée, sans rien écrire. La page affiche le mois détecté, le nombre de structures, et la liste complète des lignes en erreur.
2. **Import** : le bouton « Importer le fichier » n’apparaît que si le fichier ne contient aucune erreur. Le fichier est renvoyé et revérifié par le serveur, puis le référentiel et l’activité sont écrits.

Un fichier avec une seule ligne en erreur n’est pas importé du tout : on corrige le fichier, puis on le charge à nouveau.

Le code vit dans `src/app/api/ofii-imports/` : lecture du tableur (`ofii-xlsx.util.ts`), validation pure (`ofii-import.util.ts`), écritures Prisma (`ofii-import.repository.ts`).

### Ajouter un autre import au cockpit

Les briques communes à tous les imports de tableur sont déjà en place :

- **Service** : exposer `preview(file)` (renvoie `{ summary, details?, errors }`, sans écrire) et `apply(file)` (appelle `assertImportable(errors)` puis écrit, renvoie `{ summary }`). Types dans `src/types/import.type.ts`.
- **Routes** : `export const POST = cockpitImportRoute(preview)` dans `<import>/preview/route.ts`, et `cockpitImportRoute(apply)` dans `<import>/route.ts`. La fabrique vérifie l'accès au cockpit et lit le fichier envoyé. Déclarer les deux routes dans `src/proxy/auth-config.ts`.
- **Page** : `<SpreadsheetImport endpoint="/api/<import>" label="…" />` dans le groupe `(fonctionnalites)` du cockpit, puis activer la tuile dans `cockpit-admin.features.ts`.

## 2. Secours : script Scalingo

Le script `scripts/recurring-scripts/ofii-fill-referential-and-activity.ts` applique le même traitement à un fichier déposé dans le bucket `DOCS_BUCKET_NAME`. Il affiche les lignes en erreur et n’écrit rien s’il y en a.

```bash
yarn script ofii-fill-referential-and-activity <clef_s3_du_fichier_xlsx>
```

## 3. Comportement important

- **Onglet lu** : l’onglet `Liste` s’il existe (le mois vient alors du nom du fichier, ex. `10.25`), sinon l’onglet daté le plus récent (ex. `octobre 2025`).
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
