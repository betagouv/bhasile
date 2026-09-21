# Référentiel OFII : mise à jour mensuelle

Ce référentiel est alimenté à partir du fichier Excel mensuel fourni par l’OFII.

## 1. Pré‑requis

- **Accès S3** : le fichier XLSX doit être présent dans le bucket `DOCS_BUCKET_NAME` (voir `.env`).
- **Mapping opérateurs** : les libellés bruts du fichier OFII qui ne correspondent pas au nom de l'opérateur en base (typos, variantes de saisie) sont listés dans `Operateur.ofiiNames`. Un opérateur dont le libellé OFII est déjà son nom en base n'a rien à y déclarer.

## 2. Commande principale

Le script d’orchestration est `scripts/recurring-scripts/ofii-fill-referential-and-activity.ts`.

```bash
yarn script ofii-referential-and-activity <clef_s3_du_fichier_xlsx>
```

Ce script permet de prendre en compte un certain nombre de formats de fichier :

- télécharge le XLSX depuis S3,
- choisit l’onglet pertinent (par date ou via l’onglet `Liste`),
- met à jour le **référentiel structures** (table `Structure`) ,
- met à jour l’**activité mensuelle** (table `Activite`).

## 3. Comportement important

- **Nom de structure (`Structure.nom`)** :
  - calculé via un _clean name_ (suppression des préfixes CADA/HUDA/…, opérateur, numéro de département, etc.),
  - le nom brut OFII est conservé dans `Structure.nomOfii`.
- **Département** :
  - le fichier OFII contient le **nom** (ex. `"Allier"`),
  - le script résout le **numéro** (ex. `"03"`) à partir de la table `Departement`,
  - ce numéro est stocké dans `Structure.departementAdministratif`.
- **Opérateur** :
  - le libellé brut est mis en majuscules puis rapproché d'un opérateur par son `name` ou l'un de ses `ofiiNames`,
  - aucun opérateur n'est créé par le script : un libellé non rattaché fait échouer la ligne,
  - `Structure.operateurId` est renseigné pour les structures créées.
- **Structures absentes du fichier** :
  - toute structure encore active côté OFII (`inactiveInOfiiFileSince = null`) mais absente du fichier courant est marquée comme inactive (`inactiveInOfiiFileSince` renseigné à la date du script).

## 4. Cas d’erreur fréquents

- **Opérateur inconnu** :
  - si un libellé présent dans le fichier OFII ne correspond à aucun `name` ni `ofiiNames`, la ligne est rejetée avec un message du type :  
    `opérateur inconnu en base : <libellé> (l'ajouter dans Operateur.ofiiNames)`
  - Ajouter le libellé aux `ofiiNames` de l'opérateur concerné, ou créer l'opérateur attendu.
- **Libellé OFII rattaché à deux opérateurs** :
  - le script refuse de démarrer si un même libellé apparaît dans le `name` ou les `ofiiNames` de deux opérateurs. Retirer le doublon en base.
- **Département invalide** :
  - si la colonne "Département" contient un nom qui ne correspond à aucun enregistrement de la table `Departement`, la ligne est ignorée et un message du type est loggé :  
    `département invalide (nom attendu) : <valeur>`
  - Vérifier l’orthographe dans le XLSX ou la table `Departement`.
- **Structure non insérée** :
  - si une ligne présente un ou plusieurs problèmes (département, opérateur, etc.), elle n’est pas insérée, mais les 10 premières erreurs sont affichées dans les logs pour diagnostic.

## 5. Scripts unitaires (optionnel)

Il est également possible d’exécuter séparément :

- **Référentiel uniquement** : `scripts/recurring-scripts/ofii-fill-referential.ts`
- **Activité uniquement** : `scripts/recurring-scripts/ofii-fill-activity.ts`

Dans la pratique, l’usage recommandé est d’utiliser **uniquement** l’orchestrateur `ofii-referential-and-activity` tous les mois.
