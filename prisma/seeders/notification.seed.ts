import { Notification } from "@/generated/prisma/client";

const addDaysToNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export const createNotificationsList = (): Omit<Notification, "id">[] => [
  {
    content: `La date limite pour l’initialisation des structures dans l’outil Bhasile est prévue au 31/08/2026. Passé cette date, ce sont les agents qui seront responsables de la saisie de l’ensemble des données des structures non initialisées.`,
    startDate: addDaysToNow(-2),
    endDate: addDaysToNow(20),
    createdAt: addDaysToNow(-2),
  },
  {
    content: `La maintenance planifiée est terminée. Merci de votre patience.`,
    startDate: null,
    endDate: null,
    createdAt: addDaysToNow(-10),
  },
  {
    content: `Cette notification ne s'affiche pas.`,
    startDate: addDaysToNow(-30),
    endDate: addDaysToNow(-5),
    createdAt: addDaysToNow(-30),
  },
];
