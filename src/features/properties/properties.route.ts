import type { FastifyPluginAsync } from "fastify";
import {
  listPropertiesController,
  getPropertyController,
  createPropertyController,
  updatePropertyController,
  deletePropertyController,
} from "./properties.controller";
import {
  CreatePropertySchema,
  PropertyParamsSchema,
  PropertyQuerySchema,
  UpdatePropertySchema,
} from "./properties.schema";

export const propertiesRoute: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] };

  fastify.get(
    "/",
    {
      schema: {
        tags: ["Properties"],
        summary: "List portfolio properties",
        security: [{ bearerAuth: [] }],
        querystring: PropertyQuerySchema,
      },
      ...auth,
    },
    listPropertiesController,
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Properties"],
        summary: "Add a property",
        security: [{ bearerAuth: [] }],
        body: CreatePropertySchema,
      },
      ...auth,
    },
    createPropertyController,
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Properties"],
        summary: "Get property overview",
        security: [{ bearerAuth: [] }],
        params: PropertyParamsSchema,
      },
      ...auth,
    },
    getPropertyController,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Properties"],
        summary: "Update property",
        security: [{ bearerAuth: [] }],
        params: PropertyParamsSchema,
        body: UpdatePropertySchema,
      },
      ...auth,
    },
    updatePropertyController,
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Properties"],
        summary: "Delete property",
        security: [{ bearerAuth: [] }],
        params: PropertyParamsSchema,
      },
      ...auth,
    },
    deletePropertyController,
  );

  fastify.post(
    "/:id/refresh",
    {
      schema: {
        tags: ["Properties"],
        summary: "Trigger data refresh for property",
        security: [{ bearerAuth: [] }],
        params: PropertyParamsSchema,
      },
      ...auth,
    },
    async (request, reply) => {
      return reply.send({ message: "Refresh job enqueued" });
    },
  );
};
