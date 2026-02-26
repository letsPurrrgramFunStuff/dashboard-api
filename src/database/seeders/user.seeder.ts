import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { faker } from "@faker-js/faker";

const DEFAULT_ADMIN = {
  email: "admin@dashboard.com",
  password: "Admin@123",
  firstName: "Admin",
  lastName: "User",
  role: "admin" as const,
};

const hashPassword = (password: string): string => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const EXTRA_USERS: Array<{
  email: string;
  firstName: string;
  lastName: string;
  role: "manager" | "viewer" | "dashboard_ops";
}> = [
  {
    email: "jane.smith@dashboard.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "manager",
  },
  {
    email: "mark.johnson@dashboard.com",
    firstName: "Mark",
    lastName: "Johnson",
    role: "manager",
  },
  {
    email: "sarah.lee@dashboard.com",
    firstName: "Sarah",
    lastName: "Lee",
    role: "viewer",
  },
  {
    email: "david.chen@dashboard.com",
    firstName: "David",
    lastName: "Chen",
    role: "viewer",
  },
  {
    email: "emily.brown@dashboard.com",
    firstName: "Emily",
    lastName: "Brown",
    role: "manager",
  },
  {
    email: "ops1@dashboard.com",
    firstName: "Operations",
    lastName: "One",
    role: "dashboard_ops",
  },
  {
    email: "ops2@dashboard.com",
    firstName: "Operations",
    lastName: "Two",
    role: "dashboard_ops",
  },
  {
    email: "viewer1@dashboard.com",
    firstName: "View",
    lastName: "Only",
    role: "viewer",
  },
  {
    email: "pm.jones@dashboard.com",
    firstName: "Patricia",
    lastName: "Jones",
    role: "manager",
  },
  {
    email: "analyst@dashboard.com",
    firstName: "Alex",
    lastName: "Analyst",
    role: "viewer",
  },
];

export const seedUser = async (
  db: NodePgDatabase<typeof schema>,
  organizationId: number,
): Promise<number[]> => {
  const seededIds: number[] = [];
  const existingUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEFAULT_ADMIN.email))
    .limit(1);

  if (existingUser.length === 0) {
    const [inserted] = await db
      .insert(schema.users)
      .values({
        organizationId,
        email: DEFAULT_ADMIN.email,
        passwordHash: hashPassword(DEFAULT_ADMIN.password),
        firstName: DEFAULT_ADMIN.firstName,
        lastName: DEFAULT_ADMIN.lastName,
        role: DEFAULT_ADMIN.role,
        isActive: true,
      })
      .returning({ id: schema.users.id });
    seededIds.push(inserted.id);
    console.log(
      `🌱 Seeded admin user: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`,
    );
  } else {
    seededIds.push(existingUser[0].id);
  }
  for (const u of EXTRA_USERS) {
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, u.email))
      .limit(1);
    if (existing.length === 0) {
      const [inserted] = await db
        .insert(schema.users)
        .values({
          organizationId,
          email: u.email,
          passwordHash: hashPassword("Test@1234"),
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: true,
          lastLoginAt: faker.datatype.boolean() ? faker.date.recent() : null,
        })
        .returning({ id: schema.users.id });
      seededIds.push(inserted.id);
    } else {
      seededIds.push(existing[0].id);
    }
  }

  console.log(`🌱 Seeded ${seededIds.length} users`);
  return seededIds;
};
