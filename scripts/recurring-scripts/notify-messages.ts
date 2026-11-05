// Envoyer à chaque destinataire un mail regroupant ses messages non lus, et abandonner ceux de plus de 3 jours
// Un envoi en échec ou un abandon fait échouer le script : cron.sh remonte alors l'erreur au moniteur Sentry
// Usage: yarn script notify-messages (l'argument `scheduled`, passé par le cron, limite aux heures d'envoi)

import "dotenv/config";

import { notifyPendingTarificationMessages } from "@/app/api/tarifications/tarification.service";
import { isNotificationHour } from "@/app/api/tarifications/tarification.util";
import { getNow } from "@/app/utils/now.util";
import prisma from "@/lib/prisma";

const isScheduledRun = process.argv[2] === "scheduled";

const run = async () => {
  try {
    if (isScheduledRun && !isNotificationHour(getNow())) {
      console.log("⏭️ Hors des heures d'envoi à Paris");
      return;
    }
    console.log("✉️ Notifications des messages");

    const { sentCount, failedCount, abandonedCount } =
      await notifyPendingTarificationMessages();

    console.log(
      `${sentCount} mail(s) envoyé(s), ${failedCount} en échec, ${abandonedCount} message(s) abandonné(s)`
    );
    if (failedCount > 0 || abandonedCount > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("❌ Erreur lors des notifications de messages", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
