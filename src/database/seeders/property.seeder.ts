import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { properties } from "../schema";
import { eq, count } from "drizzle-orm";

const PROPERTY_TYPES = [
  "residential",
  "commercial",
  "mixed_use",
  "industrial",
  "other",
] as const;
const weightedRiskScore = () => {
  const tier = faker.helpers.weightedArrayElement([
    { weight: 20, value: "critical" },
    { weight: 25, value: "high" },
    { weight: 30, value: "medium" },
    { weight: 25, value: "low" },
  ]);
  if (tier === "critical")
    return faker.number.float({ min: 75, max: 100, fractionDigits: 1 });
  if (tier === "high")
    return faker.number.float({ min: 55, max: 74.9, fractionDigits: 1 });
  if (tier === "medium")
    return faker.number.float({ min: 30, max: 54.9, fractionDigits: 1 });
  return faker.number.float({ min: 0, max: 29.9, fractionDigits: 1 });
};
const NYC_BOROUGHS = [
  {
    city: "New York",
    state: "NY",
    latMin: 40.7,
    latMax: 40.88,
    lngMin: -74.02,
    lngMax: -73.905,
    zip: () =>
      faker.helpers.arrayElement([
        "10001",
        "10002",
        "10003",
        "10004",
        "10005",
        "10006",
        "10007",
        "10009",
        "10010",
        "10011",
        "10012",
        "10013",
        "10014",
        "10016",
        "10017",
        "10018",
        "10019",
        "10021",
        "10022",
        "10023",
        "10024",
        "10025",
        "10026",
        "10027",
        "10028",
        "10029",
        "10030",
        "10031",
        "10032",
        "10033",
        "10034",
        "10035",
        "10036",
        "10037",
        "10038",
        "10039",
        "10040",
      ]),
  },
  {
    city: "Brooklyn",
    state: "NY",
    latMin: 40.57,
    latMax: 40.739,
    lngMin: -74.042,
    lngMax: -73.833,
    zip: () =>
      faker.helpers.arrayElement([
        "11201",
        "11203",
        "11204",
        "11205",
        "11206",
        "11207",
        "11208",
        "11209",
        "11210",
        "11211",
        "11212",
        "11213",
        "11214",
        "11215",
        "11216",
        "11217",
        "11218",
        "11219",
        "11220",
        "11221",
        "11222",
        "11223",
        "11224",
        "11225",
        "11226",
        "11228",
        "11229",
        "11230",
        "11231",
        "11232",
        "11233",
        "11234",
        "11235",
        "11236",
        "11237",
        "11238",
        "11239",
      ]),
  },
  {
    city: "Queens",
    state: "NY",
    latMin: 40.54,
    latMax: 40.8,
    lngMin: -73.962,
    lngMax: -73.7,
    zip: () =>
      faker.helpers.arrayElement([
        "11354",
        "11355",
        "11356",
        "11357",
        "11358",
        "11360",
        "11361",
        "11362",
        "11363",
        "11364",
        "11365",
        "11366",
        "11367",
        "11368",
        "11369",
        "11370",
        "11372",
        "11373",
        "11374",
        "11375",
        "11377",
        "11378",
        "11379",
        "11385",
        "11412",
        "11413",
        "11414",
        "11415",
        "11416",
        "11417",
        "11418",
        "11419",
        "11420",
        "11421",
        "11422",
        "11423",
        "11426",
        "11427",
        "11428",
        "11429",
        "11430",
        "11432",
        "11433",
        "11434",
        "11435",
        "11436",
      ]),
  },
  {
    city: "Bronx",
    state: "NY",
    latMin: 40.785,
    latMax: 40.918,
    lngMin: -73.934,
    lngMax: -73.748,
    zip: () =>
      faker.helpers.arrayElement([
        "10451",
        "10452",
        "10453",
        "10454",
        "10455",
        "10456",
        "10457",
        "10458",
        "10459",
        "10460",
        "10461",
        "10462",
        "10463",
        "10464",
        "10465",
        "10466",
        "10467",
        "10468",
        "10469",
        "10470",
        "10471",
        "10472",
        "10473",
        "10474",
        "10475",
      ]),
  },
  {
    city: "Staten Island",
    state: "NY",
    latMin: 40.495,
    latMax: 40.651,
    lngMin: -74.259,
    lngMax: -74.034,
    zip: () =>
      faker.helpers.arrayElement([
        "10301",
        "10302",
        "10303",
        "10304",
        "10305",
        "10306",
        "10307",
        "10308",
        "10309",
        "10310",
        "10311",
        "10312",
        "10314",
      ]),
  },
];

const NYC_STREETS = [
  "Broadway",
  "Park Ave",
  "Lexington Ave",
  "Madison Ave",
  "5th Ave",
  "7th Ave",
  "8th Ave",
  "Atlantic Ave",
  "Flatbush Ave",
  "Bedford Ave",
  "Nostrand Ave",
  "Fulton St",
  "Atlantic Ave",
  "Jamaica Ave",
  "Northern Blvd",
  "Queens Blvd",
  "Roosevelt Ave",
  "Grand Concourse",
  "Fordham Rd",
  "Southern Blvd",
  "Richmond Ave",
  "Hylan Blvd",
  "Canal St",
  "Delancey St",
  "Houston St",
  "Spring St",
  "Prince St",
  "Bleecker St",
];

const randomAddress = () => {
  const num = faker.number.int({ min: 1, max: 2800 });
  const street = faker.helpers.arrayElement(NYC_STREETS);
  return `${num} ${street}`;
};
const propertyNameByType = (type: string) => {
  const suffix = faker.helpers.arrayElement([
    "LLC",
    "Associates",
    "Holdings",
    "Group",
    "Partners",
    "Properties",
    "Realty",
    "Ventures",
    "Capital",
    "Estate",
  ]);
  const names: Record<string, () => string> = {
    residential: () =>
      faker.helpers.arrayElement([
        "The",
        "Park",
        "River",
        "City",
        "Metro",
        "Urban",
        "Grand",
      ]) +
      " " +
      faker.helpers.arrayElement([
        "Residences",
        "Apartments",
        "Tower",
        "Lofts",
        "Place",
        "Manor",
        "Court",
      ]),
    commercial: () => faker.company.name() + " " + suffix,
    mixed_use: () =>
      faker.helpers.arrayElement([
        "The",
        "One",
        "Two",
        "Gateway",
        "Central",
        "Metro",
      ]) +
      " " +
      faker.helpers.arrayElement([
        "Plaza",
        "Center",
        "Hub",
        "Village",
        "Square",
        "Commons",
      ]),
    industrial: () =>
      faker.helpers.arrayElement([
        "East",
        "West",
        "North",
        "South",
        "Metro",
        "City",
      ]) +
      " " +
      faker.helpers.arrayElement([
        "Industrial",
        "Logistics",
        "Warehouse",
        "Depot",
        "Distribution",
      ]) +
      " " +
      suffix,
    other: () => faker.company.name(),
  };
  return (names[type] ?? names.other)();
};

export async function seedProperty(
  db: NodePgDatabase<any>,
  organizationId: number,
) {
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(properties)
    .where(eq(properties.organizationId, organizationId));
  if (Number(cnt) > 0) {
    console.log(`⏭️  Skipping property seed — ${cnt} already exist`);
    const existing = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.organizationId, organizationId));
    return existing.map((p) => p.id);
  }

  const propertyData = Array.from({ length: 80 }).map(() => {
    const type = faker.helpers.weightedArrayElement([
      { weight: 40, value: "residential" },
      { weight: 30, value: "commercial" },
      { weight: 15, value: "mixed_use" },
      { weight: 10, value: "industrial" },
      { weight: 5, value: "other" },
    ]) as (typeof PROPERTY_TYPES)[number];
    const borough = faker.helpers.arrayElement(NYC_BOROUGHS);
    const score = weightedRiskScore();
    const floors =
      type === "industrial"
        ? faker.number.int({ min: 1, max: 5 })
        : type === "commercial"
          ? faker.number.int({ min: 2, max: 50 })
          : faker.number.int({ min: 1, max: 30 });
    return {
      organizationId,
      name: propertyNameByType(type),
      addressLine1: randomAddress(),
      addressLine2: faker.datatype.boolean({ probability: 0.3 })
        ? faker.helpers.arrayElement([
            "Suite 100",
            "Suite 200",
            "Floor 2",
            "Floor 3",
            "Unit A",
            "Unit B",
            "Penthouse",
          ])
        : null,
      city: borough.city,
      state: borough.state,
      zip: borough.zip(),
      country: "US",
      bbl: faker.string.numeric(10),
      bin: faker.string.numeric(7),
      block: faker.string.numeric(4),
      lot: faker.string.numeric(4),
      latitude: faker.number.float({
        min: borough.latMin,
        max: borough.latMax,
        fractionDigits: 6,
      }),
      longitude: faker.number.float({
        min: borough.lngMin,
        max: borough.lngMax,
        fractionDigits: 6,
      }),
      propertyType: type,
      yearBuilt: faker.helpers.weightedArrayElement([
        { weight: 30, value: faker.number.int({ min: 1900, max: 1950 }) },
        { weight: 35, value: faker.number.int({ min: 1950, max: 1985 }) },
        { weight: 25, value: faker.number.int({ min: 1985, max: 2010 }) },
        { weight: 10, value: faker.number.int({ min: 2010, max: 2024 }) },
      ]),
      floors,
      units:
        type === "industrial"
          ? faker.number.int({ min: 1, max: 10 })
          : type === "commercial"
            ? faker.number.int({ min: 5, max: 200 })
            : faker.number.int({ min: 2, max: 350 }),
      riskScore: score,
      riskScoreUpdatedAt: faker.date.recent({ days: 30 }),
      createdAt: faker.date.past({ years: 3 }),
      updatedAt: faker.date.recent({ days: 90 }),
    };
  });

  const inserted = await db
    .insert(properties)
    .values(propertyData)
    .returning({ id: properties.id });
  console.log(`🌱 Seeded ${inserted.length} properties`);
  return inserted.map((p) => p.id);
}
