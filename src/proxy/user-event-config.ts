export const monitoredRoutes: MonitoredRoute[] = [
  {
    pattern: /^\/api\/structures$/,
    routes: ["POST", "PUT"],
  },
  {
    pattern: /^\/api\/structures\/[^/]+$/,
    routes: ["GET"],
  },
  {
    pattern: /^\/api\/cpoms$/,
    routes: ["PUT", "POST"],
  },
];

export type MonitoredRoute = {
  pattern: RegExp;
  routes: string[];
};
