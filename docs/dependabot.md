# Mise à jour des dépendances avec dependabot

## 👨‍💻 Fonctionnement

Dependabot permet de mettre à jour les dépendances de l'application selon le schéma suivant :

- une nouvelle PR chaque lundi matin qui regroupe toutes les mises mineures et patch, en général sans breaking changes. ⚠️ TypeScript ne suit pas les conventional commits et peut donc introduire des breaking changes dans des versions marquées comme mineures
- une PR par mise à jour majeure de dépendance (qui introduisent généralement des breaking changes). Ces PR ne sont pas mélangées avec d'autres MaJ de dépendances

Une période de 7 jours (ou cooldown) et prévue entre la publication de la mise à jour et sa proposition dans une PR dependabot. Cela vise à éviter de télécharger un package contaminé à sa publication.

Pour modifier la configuration, aller dans [dependabot.yml](.github/dependabot.yml)

## 🧑‍🔧 Comment faire une mise à jour

- En local, lancer `git checkout [nom de la branche dependabot]`
- Puis, exécuter `yarn pre-push` pour lancer tous les tests, le linting, les vérifications Typescript, etc
- Ensuite, lancer `yarn build` pour voir s'il n'y a pas d'erreur. Souvent, les MaJ de devDependencies influencent plus le build que les packages présents dans dependencies
- Lancer `yarn dev` et tester manuellement les fonctionnalités qui utilisent les packages qui ont été mis à jour. Vérifier le terminal et la console du navigateur, car toutes les erreurs ne sont pas visibles dans la UI
- Si l'une de ces étapes a eu un problème, faire les modifications nécessaires (changement d'import, refacto, etc) et ajouter le commit à la PR dependabot
- Squash and merge la PR 🎉
