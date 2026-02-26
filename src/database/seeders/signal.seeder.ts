import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { signals } from "../schema";
import { eq, count } from "drizzle-orm";

const SIGNAL_TYPES = [
  "permit",
  "violation",
  "complaint",
  "hazard",
  "valuation",
  "condition",
] as const;
const SIGNAL_SOURCES = [
  "nyc_open_data",
  "nearmap",
  "eagleview",
  "lightbox",
  "attom",
  "perilpulse",
  "locatenyc",
  "manual",
] as const;
const weightedSeverity = () =>
  faker.helpers.weightedArrayElement([
    { weight: 25, value: "low" },
    { weight: 35, value: "medium" },
    { weight: 28, value: "high" },
    { weight: 12, value: "critical" },
  ]);
const SIGNAL_TITLES: Record<string, string[]> = {
  permit: [
    "Dashboard Permit Application",
    "Electrical Work Permit",
    "Plumbing Permit",
    "Renovation Permit",
    "Demolition Permit",
    "New Construction Permit",
    "Alteration Permit",
    "Facade Permit",
  ],
  violation: [
    "ECB Violation - Structural",
    "DOB Violation - Fire Safety",
    "HPD Violation - Heating",
    "HPD Violation - Hot Water",
    "ECB Violation - Zoning",
    "DOB Stop Work Order",
    "DOT Violation",
    "DEP Violation - Plumbing",
  ],
  complaint: [
    "Noise Complaint",
    "Illegal Construction Complaint",
    "Elevator Malfunction Report",
    "Mold/Dampness Complaint",
    "Heat/Hot Water Complaint",
    "Pest Infestation Report",
    "Structural Concern",
    "Fire Safety Complaint",
  ],
  hazard: [
    "Asbestos Detection",
    "Lead Paint Hazard",
    "Structural Instability",
    "Flood Risk Assessment",
    "Gas Leak Report",
    "Electrical Hazard",
    "Fall Protection Risk",
  ],
  valuation: [
    "Annual Property Assessment",
    "Market Value Update",
    "Tax Class Change",
    "Assessed Value Increase",
    "Property Tax Grievance",
  ],
  condition: [
    "Roof Condition Assessment",
    "Facade Inspection Report",
    "FISP Filing",
    "Annual Boiler Inspection",
    "Elevator Inspection",
    "Sprinkler System Check",
    "Emergency Lighting Inspection",
  ],
};

export async function seedSignal(
  db: NodePgDatabase<any>,
  propertyIds: number[],
) {
  const [{ cnt }] = await db.select({ cnt: count() }).from(signals);
  if (Number(cnt) > 0) {
    console.log(`⏭️  Skipping signal seed — ${cnt} already exist`);
    const existing = await db.select({ id: signals.id }).from(signals);
    return existing.map((s) => s.id);
  }
  const signalData = Array.from({
    length: Math.max(600, propertyIds.length * 10),
  }).map(() => {
    const type = faker.helpers.weightedArrayElement([
      { weight: 25, value: "violation" },
      { weight: 20, value: "complaint" },
      { weight: 20, value: "permit" },
      { weight: 15, value: "condition" },
      { weight: 12, value: "hazard" },
      { weight: 8, value: "valuation" },
    ]) as (typeof SIGNAL_TYPES)[number];
    const source = faker.helpers.weightedArrayElement([
      { weight: 40, value: "nyc_open_data" },
      { weight: 15, value: "nearmap" },
      { weight: 12, value: "eagleview" },
      { weight: 10, value: "lightbox" },
      { weight: 8, value: "attom" },
      { weight: 7, value: "perilpulse" },
      { weight: 5, value: "locatenyc" },
      { weight: 3, value: "manual" },
    ]) as (typeof SIGNAL_SOURCES)[number];
    const severity = weightedSeverity();
    const isOpen = faker.datatype.boolean({ probability: 0.45 });
    const eventDate = faker.date.past({ years: 3 });
    const titles = SIGNAL_TITLES[type];
    return {
      propertyId: faker.helpers.arrayElement(propertyIds),
      signalType: type,
      source,
      eventDate: eventDate.toISOString().split("T")[0],
      status: isOpen
        ? faker.helpers.arrayElement(["open", "pending"])
        : "closed",
      severity,
      title: faker.helpers.arrayElement(titles),
      description: faker.lorem.sentences({ min: 1, max: 3 }),
      rawPayload: {},
      normalizedFields: {},
      externalId: faker.string.alphanumeric(12).toUpperCase(),
      isActive: isOpen,
      resolvedAt: isOpen
        ? null
        : faker.date.between({ from: eventDate, to: new Date() }),
      createdAt: eventDate,
      updatedAt: faker.date.between({ from: eventDate, to: new Date() }),
    };
  });

  const inserted = await db
    .insert(signals)
    .values(signalData)
    .returning({ id: signals.id });
  console.log(`🌱 Seeded ${inserted.length} signals`);
  return inserted.map((s) => s.id);
}
