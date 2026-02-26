import axios from "axios";
const BASE_URL = "https://data.cityofnewyork.us/resource";
export const NYC_DATASETS = {
  DOB_PERMITS: "ipu4-2q9a",
  DOB_VIOLATIONS: "3h2n-5cm9",
  ECB_VIOLATIONS: "6bgk-3dad",
  COMPLAINTS_311: "erm2-nwe9",
} as const;

export class NycOpenDataClient {
  private appToken: string;

  constructor() {
    this.appToken = process.env.NYC_OPEN_DATA_APP_TOKEN ?? "";
  }

  async fetchDataset(
    datasetId: string,
    params: Record<string, string>,
  ): Promise<unknown[]> {
    const url = `${BASE_URL}/${datasetId}.json`;
    const response = await axios.get(url, {
      headers: { "X-App-Token": this.appToken },
      params,
    });
    return response.data as unknown[];
  }

  async fetchPermitsByBin(bin: string, since?: string): Promise<unknown[]> {
    const params: Record<string, string> = { bin };
    if (since) params["$where"] = `filing_date > '${since}'`;
    return this.fetchDataset(NYC_DATASETS.DOB_PERMITS, params);
  }

  async fetchViolationsByBin(bin: string, since?: string): Promise<unknown[]> {
    const params: Record<string, string> = { bin };
    if (since) params["$where"] = `issue_date > '${since}'`;
    return this.fetchDataset(NYC_DATASETS.DOB_VIOLATIONS, params);
  }

  async fetchEcbViolationsByBin(
    bin: string,
    since?: string,
  ): Promise<unknown[]> {
    const params: Record<string, string> = { bin };
    if (since) params["$where"] = `issue_date > '${since}'`;
    return this.fetchDataset(NYC_DATASETS.ECB_VIOLATIONS, params);
  }

  async fetch311ComplaintsByBbl(
    bbl: string,
    since?: string,
  ): Promise<unknown[]> {
    const params: Record<string, string> = {};
    params["$where"] =
      `bbl = '${bbl}'${since ? ` AND created_date > '${since}'` : ""}`;
    params["$limit"] = "1000";
    return this.fetchDataset(NYC_DATASETS.COMPLAINTS_311, params);
  }
}
