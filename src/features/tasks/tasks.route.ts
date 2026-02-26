import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { eq, and, desc, count, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import * as schema from "../../database/schema";

const CreateTaskSchema = Type.Object({
  propertyId: Type.Number(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  category: Type.Optional(Type.String()),
  priority: Type.Optional(Type.String()),
  dueDate: Type.Optional(Type.String()),
  assigneeId: Type.Optional(Type.Number()),
  signalId: Type.Optional(Type.Number()),
});

const TaskQuery = Type.Object({
  page: Type.Optional(Type.Number({ default: 1 })),
  pageSize: Type.Optional(Type.Number({ default: 25 })),
  propertyId: Type.Optional(Type.Number()),
  status: Type.Optional(Type.String()),
  assigneeId: Type.Optional(Type.Number()),
  category: Type.Optional(Type.String()),
});

export const tasksRoute: FastifyPluginAsync = async (fastify) => {
  const auth = { onRequest: [fastify.authenticate] };
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Tasks"],
        summary: "List tasks",
        security: [{ bearerAuth: [] }],
        querystring: TaskQuery,
      },
      ...auth,
    },
    async (req, reply) => {
      const { organizationId } = req.user as { organizationId: number };
      const q = req.query as {
        page?: number;
        pageSize?: number;
        propertyId?: number;
        status?: string;
        assigneeId?: number;
        category?: string;
      };
      const page = Math.max(1, q.page ?? 1);
      const pageSize = Math.min(100, q.pageSize ?? 25);
      const offset = (page - 1) * pageSize;

      const conditions = [
        eq(schema.tasks.organizationId, organizationId),
        isNull(schema.tasks.deletedAt),
        ...(q.propertyId != null
          ? [eq(schema.tasks.propertyId, q.propertyId)]
          : []),
        ...(q.status ? [sql`${schema.tasks.status} = ${q.status}`] : []),
        ...(q.assigneeId != null
          ? [eq(schema.tasks.assigneeId, q.assigneeId)]
          : []),
        ...(q.category ? [sql`${schema.tasks.category} = ${q.category}`] : []),
      ];

      const assigneeTable = alias(schema.users, "assignee");

      const [data, [{ total }]] = await Promise.all([
        fastify.db
          .select({
            id: schema.tasks.id,
            title: schema.tasks.title,
            description: schema.tasks.description,
            category: schema.tasks.category,
            priority: schema.tasks.priority,
            status: schema.tasks.status,
            dueDate: schema.tasks.dueDate,
            propertyId: schema.tasks.propertyId,
            assigneeId: schema.tasks.assigneeId,
            createdAt: schema.tasks.createdAt,
            updatedAt: schema.tasks.updatedAt,
            propertyName: schema.properties.name,
            assigneeFirstName: assigneeTable.firstName,
            assigneeLastName: assigneeTable.lastName,
            assigneeEmail: assigneeTable.email,
          })
          .from(schema.tasks)
          .leftJoin(
            schema.properties,
            eq(schema.tasks.propertyId, schema.properties.id),
          )
          .leftJoin(
            assigneeTable,
            eq(schema.tasks.assigneeId, assigneeTable.id),
          )
          .where(and(...conditions))
          .orderBy(desc(schema.tasks.createdAt))
          .limit(pageSize)
          .offset(offset),
        fastify.db
          .select({ total: count() })
          .from(schema.tasks)
          .where(and(...conditions)),
      ]);

      return reply.send({ data, total: Number(total), page, pageSize });
    },
  );
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Create a task",
        security: [{ bearerAuth: [] }],
        body: CreateTaskSchema,
      },
      ...auth,
    },
    async (req, reply) => {
      const { organizationId, id: createdBy } = req.user as {
        organizationId: number;
        id: number;
      };
      const body = req.body as {
        propertyId: number;
        title: string;
        description?: string;
        category?: string;
        priority?: string;
        dueDate?: string;
        assigneeId?: number;
        signalId?: number;
      };
      const [task] = await fastify.db
        .insert(schema.tasks)
        .values({
          propertyId: body.propertyId,
          title: body.title,
          organizationId,
          createdBy,
          updatedAt: new Date(),
          ...(body.description !== undefined && {
            description: body.description,
          }),
          ...(body.category !== undefined && {
            category: body.category as
              | "inspection"
              | "violation_followup"
              | "vendor_quote"
              | "legal"
              | "maintenance"
              | "other",
          }),
          ...(body.priority !== undefined && {
            priority: body.priority as "low" | "normal" | "high" | "urgent",
          }),
          ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
          ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
          ...(body.signalId !== undefined && { signalId: body.signalId }),
        })
        .returning();
      return reply.status(201).send({ data: task });
    },
  );
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Get task detail",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { organizationId } = req.user as { organizationId: number };
      const { id } = req.params as { id: string };
      const [task] = await fastify.db
        .select()
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.id, parseInt(id)),
            eq(schema.tasks.organizationId, organizationId),
            isNull(schema.tasks.deletedAt),
          ),
        )
        .limit(1);
      if (!task) return reply.status(404).send({ message: "Task not found" });
      return reply.send({ data: task });
    },
  );
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Update task",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { organizationId } = req.user as { organizationId: number };
      const { id } = req.params as { id: string };
      const body = req.body as Record<string, unknown>;
      const [task] = await fastify.db
        .update(schema.tasks)
        .set({ ...body, updatedAt: new Date() })
        .where(
          and(
            eq(schema.tasks.id, parseInt(id)),
            eq(schema.tasks.organizationId, organizationId),
          ),
        )
        .returning();
      if (!task) return reply.status(404).send({ message: "Task not found" });
      return reply.send({ data: task });
    },
  );
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Delete task",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { organizationId } = req.user as { organizationId: number };
      const { id } = req.params as { id: string };
      await fastify.db
        .update(schema.tasks)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(schema.tasks.id, parseInt(id)),
            eq(schema.tasks.organizationId, organizationId),
          ),
        );
      return reply.status(204).send();
    },
  );
  fastify.post(
    "/:id/comments",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Add comment to task",
        security: [{ bearerAuth: [] }],
        body: Type.Object({ body: Type.String() }),
      },
      ...auth,
    },
    async (req, reply) => {
      const { id: authorId } = req.user as { id: number };
      const { id } = req.params as { id: string };
      const { body: commentBody } = req.body as { body: string };
      const [comment] = await fastify.db
        .insert(schema.taskComments)
        .values({ taskId: parseInt(id), authorId, body: commentBody })
        .returning();
      return reply.status(201).send({ data: comment });
    },
  );
  fastify.delete(
    "/:id/comments/:cid",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Delete comment",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { cid } = req.params as { id: string; cid: string };
      await fastify.db
        .update(schema.taskComments)
        .set({ deletedAt: new Date() })
        .where(eq(schema.taskComments.id, parseInt(cid)));
      return reply.status(204).send();
    },
  );
  fastify.post(
    "/:id/attachments",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Upload attachment (multipart)",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (_req, reply) =>
      reply.status(201).send({ message: "TODO: implement multipart upload" }),
  );
  fastify.delete(
    "/:id/attachments/:aid",
    {
      schema: {
        tags: ["Tasks"],
        summary: "Remove attachment",
        security: [{ bearerAuth: [] }],
      },
      ...auth,
    },
    async (req, reply) => {
      const { aid } = req.params as { id: string; aid: string };
      await fastify.db
        .delete(schema.taskAttachments)
        .where(eq(schema.taskAttachments.id, parseInt(aid)));
      return reply.status(204).send();
    },
  );
};
