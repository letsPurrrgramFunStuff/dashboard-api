import { loginRoute } from "@src/features/auth/login/login.route";
import { logoutRoute } from "@src/features/auth/logout/logout.route";
import { resetPasswordRoute } from "@src/features/auth/reset-password/reset-password.route";
import { usersRoute } from "@src/features/users/users.route";
import { organizationsRoute } from "@src/features/organizations/organizations.route";
import { propertiesRoute } from "@src/features/properties/properties.route";
import { signalsRoute } from "@src/features/signals/signals.route";
import { conditionsRoute } from "@src/features/conditions/conditions.route";
import { tasksRoute } from "@src/features/tasks/tasks.route";
import { alertsRoute } from "@src/features/alerts/alerts.route";
import { reportsRoute } from "@src/features/reports/reports.route";
import { adminRoute } from "@src/features/admin/admin.route";

const API_VERSION = process.env.API_VERSION ?? "v1";
const apiPrefix = `/api/${API_VERSION}`;

export const registerRoutes = () => {
  fastify.register(loginRoute, { prefix: `${apiPrefix}/auth/login` });
  fastify.register(logoutRoute, { prefix: `${apiPrefix}/auth/logout` });
  fastify.register(resetPasswordRoute, {
    prefix: `${apiPrefix}/auth/reset-password`,
  });
  fastify.register(usersRoute, { prefix: `${apiPrefix}/users` });
  fastify.register(organizationsRoute, {
    prefix: `${apiPrefix}/organizations`,
  });
  fastify.register(propertiesRoute, { prefix: `${apiPrefix}/properties` });
  fastify.register(signalsRoute, { prefix: `${apiPrefix}/properties` });
  fastify.register(conditionsRoute, { prefix: `${apiPrefix}/properties` });
  fastify.register(tasksRoute, { prefix: `${apiPrefix}/tasks` });
  fastify.register(alertsRoute, { prefix: `${apiPrefix}/alerts` });
  fastify.register(reportsRoute, { prefix: `${apiPrefix}/reports` });
  fastify.register(adminRoute, { prefix: `${apiPrefix}/admin` });
};
