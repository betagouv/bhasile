import { Notification } from "@/generated/prisma/client";

const addDaysToNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

export const createNotificationsList = (): Omit<Notification, "id">[] => [
  {
    content: `<p>La date limite pour <strong>l’initialisation des structures dans l’outil Bhasile</strong> est prévue au 31/08/2026. Passé cette date, ce sont les agents qui seront responsables de la saisie de l’ensemble des données des structures non initialisées.</p>`,
    startDate: addDaysToNow(-2),
    endDate: addDaysToNow(20),
    createdAt: addDaysToNow(-2),
  },
  {
    content: `<p>La maintenance planifiée est terminée.</p><hr/><p>Merci de votre patience.</p>`,
    startDate: null,
    endDate: null,
    createdAt: addDaysToNow(-10),
  },
  {
    content: `<p>Cette notification ne s'affiche pas.</p>`,
    startDate: addDaysToNow(-30),
    endDate: addDaysToNow(-5),
    createdAt: addDaysToNow(-30),
  },
];
