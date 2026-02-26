import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { alerts } from "../schema";
import { count } from "drizzle-orm";

const ALERT_TYPES = [
  "new_violation",
  "violation_resolved",
  "new_permit",
  "complaint_spike",
  "condition_change",
] as const;

const ALERT_TITLES: Record<string, string[]> = {
  new_violation: [
    "New ECB Violation Filed",
    "HPD Violation Issued — Heating",
    "DOB Stop Work Order Issued",
    "Fire Safety Violation Recorded",
    "Structural Deficiency Flagged",
    "DEP Plumbing Violation",
    "New HPD Violation — Hot Water",
    "ECB Zoning Violation — New Filing",
  ],
  violation_resolved: [
    "ECB Violation Closed",
    "HPD Violation Resolved",
    "Outstanding Violation Dismissed",
    "Stop Work Order Lifted",
    "Violation Certificate of Correction Filed",
    "DOB Violation Cleared",
  ],
  new_permit: [
    "New Dashboard Permit Filed",
    "Electrical Work Permit Issued",
    "Renovation Permit Approved",
    "Alteration Permit Application",
    "New Construction Permit Filed",
    "Facade Repair Permit Issued",
  ],
  complaint_spike: [
    "Unusual Complaint Activity Detected",
    "Multiple Noise Complaints Filed",
    "Heat Complaint Cluster",
    "Elevator Complaints Trending Up",
    "Pest Complaints — Action Required",
    "Increase in Water Complaints",
  ],
  condition_change: [
    "Roof Condition Degraded",
    "Facade Condition Worsened",
    "HVAC System Alert",
    "Boiler Efficiency Drop Detected",
    "Structural Score Change",
    "Environmental Risk Score Updated",
    "Flood Risk Level Changed",
  ],
};

export async function seedAlert(
  db: NodePgDatabase<any>,
  organizationId: number,
  propertyIds: number[],
  taskIds: number[],
  signalIds: number[],
) {
  const [{ cnt }] = await db.select({ cnt: count() }).from(alerts);
  if (Number(cnt) > 0) {
    console.log(`⏭️  Skipping alert seed — ${cnt} already exist`);
    return;
  }

  const alertData = Array.from({ length: 1500 }).map(() => {
    const alertType = faker.helpers.weightedArrayElement([
      { weight: 35, value: "new_violation" },
      { weight: 20, value: "violation_resolved" },
      { weight: 18, value: "new_permit" },
      { weight: 15, value: "complaint_spike" },
      { weight: 12, value: "condition_change" },
    ]) as (typeof ALERT_TYPES)[number];
    const severity = faker.helpers.weightedArrayElement([
      { weight: 25, value: "low" },
      { weight: 35, value: "medium" },
      { weight: 28, value: "high" },
      { weight: 12, value: "critical" },
    ]);
    const createdAt = faker.date.past({ years: 1 });
    const isRead = faker.datatype.boolean({ probability: 0.55 });
    const isDismissed = !isRead && faker.datatype.boolean({ probability: 0.2 });
    const titles = ALERT_TITLES[alertType];
    return {
      organizationId,
      propertyId: faker.helpers.arrayElement(propertyIds),
      signalId: faker.helpers.arrayElement(signalIds),
      taskId: faker.datatype.boolean({ probability: 0.3 })
        ? faker.helpers.arrayElement(taskIds)
        : null,
      alertType,
      severity,
      title: faker.helpers.arrayElement(titles),
      body: faker.lorem.sentences({ min: 1, max: 3 }),
      isRead,
      isDismissed,
      createdAt,
      readAt: isRead
        ? faker.date.between({ from: createdAt, to: new Date() })
        : null,
      dismissedAt: isDismissed
        ? faker.date.between({ from: createdAt, to: new Date() })
        : null,
    };
  });

  await db.insert(alerts).values(alertData);
  console.log(`🌱 Seeded ${alertData.length} alerts`);
}
