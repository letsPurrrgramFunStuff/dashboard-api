import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { tasks } from "../schema";
import { count } from "drizzle-orm";

const TASK_CATEGORIES = [
  "inspection",
  "violation_followup",
  "vendor_quote",
  "legal",
  "maintenance",
  "other",
] as const;
const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const TASK_STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "resolved",
  "closed",
] as const;

const TASK_TITLES: Record<string, string[]> = {
  inspection: [
    "Annual Boiler Inspection",
    "Facade Local Law 11 Inspection",
    "Elevator Annual Inspection",
    "Fire Suppression System Inspection",
    "Roof Condition Inspection",
    "Electrical Panel Inspection",
    "HVAC Unit Inspection",
    "Sprinkler System Inspection",
    "Standpipe Inspection",
    "Emergency Generator Inspection",
  ],
  violation_followup: [
    "Respond to HPD Heating Violation",
    "Clear ECB Structural Violation",
    "Address DOB Stop Work Order",
    "File Response to ECB Zoning Violation",
    "Correct HPD Mold Violation",
    "Resolve DOB Work Without Permit",
    "Follow Up on Fire Safety Violation",
    "Clear Outstanding DEP Violation",
    "Respond to DOT Sidewalk Violation",
  ],
  vendor_quote: [
    "Get Quotes for Roof Replacement",
    "Obtain HVAC Repair Estimates",
    "Request Elevator Modernization Quotes",
    "Plumbing Repair Vendor Quotes",
    "Lobby Renovation Contractor Bids",
    "Facade Repair Cost Estimates",
    "Window Replacement Quotes",
    "Security System Upgrade Bids",
    "Parking Lot Resurfacing Quotes",
  ],
  legal: [
    "Prepare Lease Renewal Documentation",
    "Review Tenant Non-Payment Case",
    "File Court Response for Holdover",
    "Draft Contractor Dispute Letter",
    "Prepare Warranty of Habitability Response",
    "Review Insurance Claim Documentation",
    "Respond to DHCR Complaint",
    "Prepare SCRIE/DRIE Application",
  ],
  maintenance: [
    "Repair Lobby Water Damage",
    "Replace Roof Section",
    "Fix Elevator Door Sensor",
    "Repair Basement Waterproofing",
    "Replace HVAC Filters",
    "Fix Entrance Intercom System",
    "Repair Storm Drain",
    "Paint Common Areas",
    "Replace Mailbox Unit",
    "Fix Roof Drain",
    "Repair Concrete Stoop",
    "Replace Boiler Burner Assembly",
  ],
  other: [
    "Coordinate Tenant Communication",
    "Update Emergency Contact List",
    "Review Insurance Policy Renewals",
    "Process Superintendent Payroll",
    "Update Dashboard Registration",
    "Renew Operating Certificate",
  ],
};

export async function seedTask(
  db: NodePgDatabase<any>,
  organizationId: number,
  propertyIds: number[],
  userIds: number[],
  signalIds: number[],
) {
  const [{ cnt }] = await db.select({ cnt: count() }).from(tasks);
  if (Number(cnt) > 0) {
    console.log(`⏭️  Skipping task seed — ${cnt} already exist`);
    const existing = await db.select({ id: tasks.id }).from(tasks);
    return existing.map((t) => t.id);
  }

  const taskData = Array.from({ length: 1500 }).map(() => {
    const category = faker.helpers.weightedArrayElement([
      { weight: 30, value: "maintenance" },
      { weight: 25, value: "violation_followup" },
      { weight: 20, value: "inspection" },
      { weight: 10, value: "vendor_quote" },
      { weight: 8, value: "legal" },
      { weight: 7, value: "other" },
    ]) as (typeof TASK_CATEGORIES)[number];
    const priority = faker.helpers.weightedArrayElement([
      { weight: 20, value: "low" },
      { weight: 40, value: "normal" },
      { weight: 28, value: "high" },
      { weight: 12, value: "urgent" },
    ]) as (typeof TASK_PRIORITIES)[number];
    const status = faker.helpers.weightedArrayElement([
      { weight: 35, value: "open" },
      { weight: 25, value: "in_progress" },
      { weight: 10, value: "blocked" },
      { weight: 20, value: "resolved" },
      { weight: 10, value: "closed" },
    ]) as (typeof TASK_STATUSES)[number];
    const createdAt = faker.date.past({ years: 2 });
    const isDone = status === "resolved" || status === "closed";
    const titles = TASK_TITLES[category];
    return {
      propertyId: faker.helpers.arrayElement(propertyIds),
      organizationId,
      signalId: faker.datatype.boolean({ probability: 0.6 })
        ? faker.helpers.arrayElement(signalIds)
        : null,
      title: faker.helpers.arrayElement(titles),
      description: faker.lorem.sentences({ min: 1, max: 4 }),
      category,
      priority,
      status,
      assigneeId: faker.datatype.boolean({ probability: 0.85 })
        ? faker.helpers.arrayElement(userIds)
        : null,
      dueDate: isDone
        ? faker.date
            .between({ from: createdAt, to: new Date() })
            .toISOString()
            .split("T")[0]
        : faker.date
            .soon({ days: 90, refDate: new Date() })
            .toISOString()
            .split("T")[0],
      createdBy: faker.helpers.arrayElement(userIds),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    };
  });

  const inserted = await db
    .insert(tasks)
    .values(taskData)
    .returning({ id: tasks.id });
  console.log(`🌱 Seeded ${inserted.length} tasks`);
  return inserted.map((t) => t.id);
}
