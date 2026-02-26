import type { signals } from "@database/schema";
import type { InferInsertModel } from "drizzle-orm";

type SignalInsert = InferInsertModel<typeof signals>;

export const normalizePermit = (
  propertyId: number,
  raw: Record<string, unknown>,
): Partial<SignalInsert> => ({
  propertyId,
  signalType: "permit",
  source: "nyc_open_data",
  externalId: (raw["job__"] as string) ?? (raw["job_filing_number"] as string),
  title: `Permit: ${raw["job_type"] ?? "Work"} — ${raw["work_type"] ?? "N/A"}`,
  description: (raw["job_description"] as string) ?? "",
  eventDate: (raw["filing_date"] as string) ?? (raw["approval_date"] as string),
  status: (raw["job_status"] as string) ?? "filed",
  severity: "low",
  isActive: true,
  rawPayload: raw as Record<string, unknown>,
  normalizedFields: {
    jobType: raw["job_type"],
    workType: raw["work_type"],
    filingDate: raw["filing_date"],
    approvalDate: raw["approval_date"],
    expirationDate: raw["expiration_date"],
    bin: raw["bin__"],
    bbl: raw["bbl__"],
  },
});

export const normalizeViolation = (
  propertyId: number,
  raw: Record<string, unknown>,
  source: "dob" | "ecb" = "dob",
): Partial<SignalInsert> => {
  const isOpen =
    (raw["violation_category"] as string)?.toLowerCase().includes("active") ||
    ((raw["ecb_violation_status"] as string)?.toLowerCase() === "resolve") ===
      false;

  return {
    propertyId,
    signalType: "violation",
    source: "nyc_open_data",
    externalId: (source === "ecb"
      ? raw["ecb_violation_number"]
      : raw["isn_dob_bis_viol"]) as string,
    title: `Violation (${source.toUpperCase()}): ${raw["description"] ?? raw["violation_type"] ?? "Unknown"}`,
    description: (raw["description"] as string) ?? "",
    eventDate: raw["issue_date"] as string,
    status: isOpen ? "open" : "resolved",
    severity: resolveSeverity(raw),
    isActive: isOpen,
    resolvedAt: isOpen ? undefined : new Date(),
    rawPayload: raw as Record<string, unknown>,
    normalizedFields: {
      violationType: raw["violation_type"] ?? raw["ecb_violation_status"],
      issueDate: raw["issue_date"],
      dispositionDate: raw["disposition_date"],
      bin: raw["bin"],
      bbl: raw["bbl"],
    },
  };
};

export const normalize311Complaint = (
  propertyId: number,
  raw: Record<string, unknown>,
): Partial<SignalInsert> => ({
  propertyId,
  signalType: "complaint",
  source: "nyc_open_data",
  externalId: raw["unique_key"] as string,
  title: `311 Complaint: ${raw["complaint_type"] ?? "Unknown"}`,
  description: (raw["descriptor"] as string) ?? "",
  eventDate: raw["created_date"] as string,
  status: (raw["status"] as string)?.toLowerCase() ?? "open",
  severity: "low",
  isActive: (raw["status"] as string)?.toLowerCase() === "open",
  rawPayload: raw as Record<string, unknown>,
  normalizedFields: {
    complaintType: raw["complaint_type"],
    descriptor: raw["descriptor"],
    agency: raw["agency"],
    createdDate: raw["created_date"],
    closedDate: raw["closed_date"],
    bbl: raw["bbl"],
  },
});

const resolveSeverity = (
  raw: Record<string, unknown>,
): "low" | "medium" | "high" | "critical" => {
  const desc = (
    (raw["description"] ?? raw["violation_type"] ?? "") as string
  ).toLowerCase();
  if (desc.includes("immediately dangerous") || desc.includes("class 1"))
    return "critical";
  if (desc.includes("hazardous") || desc.includes("class 2")) return "high";
  if (desc.includes("class 3")) return "medium";
  return "low";
};
