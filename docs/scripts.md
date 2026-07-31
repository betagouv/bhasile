# Exécution de scripts

Il est possible, via un `one off container`, de lancer un peuplement de la base de données

## Pourquoi utiliser des scripts?

Plusieurs raisons peuvent venir le justifier et on distinguera essentiellement deux cas d'usage

- **Migration de données** : Ajouter de nouvelles colonnes, transformer des données existantes.
- **Remplissage et nettoyage** : Remplir des tables nouvellement créées avec des données historiques ; ou supprimer des données obsolètes, corriger des incohérences.

## Comment exécuter un script

Par souci de clarté, deux routes sont possibles selon le cas décrit dessus :

### Migration des données

1. **Créer le script** dans `scripts/one-off-scripts/` avec le format `YYYYMMDD-description.ts`

   ```bash
   # Exemple : scripts/one-off-scripts/20251020-migrate-forms-prod.ts
   ```

   Le script étant amené à n'être exécuté qu'une fois, il est important de bien le dater.

2. **Exécuter le script en prod** :
   ```bash
   scalingo -a <scalingo_app_name> run "yarn one-off 20251020-migrate-forms-and-steps"
   ```

### Remplissage et nettoyage

1. **Créer le script** dans `scripts/recurring-scripts/` avec le format `description.ts`

   ```bash
   # Exemple : scripts/recurring-scripts/fill-cpoms.ts
   ```

   Le script étant amené à être réutilisé, ne pas le dater.

2. **Exécuter le script en prod** :
   ```bash
   scalingo -a <scalingo_app_name> run "yarn script fill-cpoms my_cpom_file.csv"
   ```
   ⚠️ Certains scripts nécessitent un second argument comme le nom du fichier source.

## Crons et postdeploy

Les crons sont déclarés dans `cron.json` à la racine et exécutés par Scalingo. Chaque job passe par `yarn cronify` qui ne lance le script que si la variable d'environnement `IS_PRODUCTION=true` est présente (en prod donc).

Le postdeploy (`scripts/postdeploy.sh` : suppression/recréation des vues + `prisma migrate deploy`) peut être sauté sur un déploiement en posant `SKIP_POSTDEPLOY=1`, puis en la retirant.
Garde-fou : le skip est ignoré si `IS_PRODUCTION=true` : la prod est toujours migrée, même si la variable a été écrite par erreur.

## Bonnes pratiques

- **Idempotence** : Le script doit pouvoir s'exécuter plusieurs fois sans effet de bord.
- **Backup** : Sur la base de prod, penser à réaliser avant exécution du script un backup manuel des données.
