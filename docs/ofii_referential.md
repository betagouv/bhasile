# Référentiel OFII : mise à jour mensuelle

Ce référentiel est alimenté à partir du fichier Excel mensuel fourni par l’OFII.

## 1. Pré‑requis

- **Accès S3** : le fichier XLSX doit être présent dans le bucket `DOCS_BUCKET_NAME` (voir `.env`).
- **Mapping opérateurs** : un JSON de mapping brut → nom normalisé doit exister dans `DOCS_BUCKET_NAME`, clé `OFII_OPERATEUR_MAPPING_KEY` (par défaut : `operateurs_to_match.json`). Il permet d'harmoniser les noms et d'éviter de se retrouver avec des typos.
  - Exemple :

```json
{
  "FRANCE TERRE D ASILE": "FRANCE TERRE D'ASILE"
}
```

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
  - les noms bruts sont normalisés via le JSON de mapping,
  - les opérateurs sont créés / retrouvés via `ensureOperateursExist`,
  - `Structure.operateurId` est renseigné pour les structures créées.
- **Structures absentes du fichier** :
  - toute structure encore active côté OFII (`inactiveInOfiiFileSince = null`) mais absente du fichier courant est marquée comme inactive (`inactiveInOfiiFileSince` renseigné à la date du script).

## 4. Cas d’erreur fréquents

- **Opérateur inconnu** :
  - si un opérateur présent dans le fichier OFII n’est pas dans le mapping / pas gérable par `ensureOperateursExist`, le script échoue avec un message du type :  
    `❌ Des opérateurs présents dans le fichier OFII sont inconnus en base.`
  - Ajouter l’entrée manquante dans le JSON de mapping, ou créer l’opérateur attendu.
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
