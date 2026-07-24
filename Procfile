postdeploy: if [ "$SKIP_POSTDEPLOY" = "1" ]; then echo "Postdeploy ignoré, pas de déploiement Prisma"; else yarn delete-views && yarn prisma:deploy && yarn apply-views; fi
