import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

let connection: IORedis;

export const getRedisConnection = () => {
  if (!connection) {
    connection = new IORedis(
      process.env.REDIS_URL ?? "redis://localhost:6379",
      {
        maxRetriesPerRequest: null,
      },
    );
  }
  return connection;
};
export const QUEUE_NAMES = {
  NYC_DELTA: "ingestion-nyc-delta",
  HAZARD: "ingestion-hazard",
  VALUATION: "ingestion-valuation",
  CONDITION: "ingestion-condition",
  ON_DEMAND: "ingestion-on-demand",
} as const;
let nycDeltaQueue: Queue;
let hazardQueue: Queue;
let valuationQueue: Queue;
let conditionQueue: Queue;
let onDemandQueue: Queue;

export const getQueue = (name: string) => {
  const conn = getRedisConnection();
  return new Queue(name, { connection: conn });
};

export const initializeQueues = () => {
  const conn = getRedisConnection();

  nycDeltaQueue = new Queue(QUEUE_NAMES.NYC_DELTA, { connection: conn });
  hazardQueue = new Queue(QUEUE_NAMES.HAZARD, { connection: conn });
  valuationQueue = new Queue(QUEUE_NAMES.VALUATION, { connection: conn });
  conditionQueue = new Queue(QUEUE_NAMES.CONDITION, { connection: conn });
  onDemandQueue = new Queue(QUEUE_NAMES.ON_DEMAND, { connection: conn });
  nycDeltaQueue.upsertJobScheduler(
    "daily-nyc-delta",
    { pattern: "0 2 * * *" },
    {
      name: "nyc-delta-all-properties",
      data: { allProperties: true },
    },
  );

  hazardQueue.upsertJobScheduler(
    "weekly-hazard",
    { pattern: "0 3 * * 1" },
    {
      name: "hazard-all-properties",
      data: { allProperties: true },
    },
  );

  valuationQueue.upsertJobScheduler(
    "monthly-valuation",
    { pattern: "0 4 1 * *" },
    {
      name: "valuation-all-properties",
      data: { allProperties: true },
    },
  );

  conditionQueue.upsertJobScheduler(
    "weekly-condition",
    { pattern: "0 5 * * 2" },
    {
      name: "condition-all-properties",
      data: { allProperties: true },
    },
  );

  console.log("✅ Ingestion queues initialized");
  initializeWorkers();
};

const initializeWorkers = () => {
  const conn = getRedisConnection();

  new Worker(QUEUE_NAMES.NYC_DELTA, processNycDeltaJob, { connection: conn });
  new Worker(QUEUE_NAMES.HAZARD, processHazardJob, { connection: conn });
  new Worker(QUEUE_NAMES.VALUATION, processValuationJob, { connection: conn });
  new Worker(QUEUE_NAMES.CONDITION, processConditionJob, { connection: conn });
  new Worker(QUEUE_NAMES.ON_DEMAND, processOnDemandJob, { connection: conn });
};
const processNycDeltaJob = async (job: Job) => {
  const { NycOpenDataService } =
    await import("./nyc-open-data/nyc-open-data.service");
  const service = new NycOpenDataService();
  await service.runDelta(job.data);
};

const processHazardJob = async (job: Job) => {
  const { HazardService } = await import("./hazard/hazard.service");
  const service = new HazardService();
  await service.run(job.data);
};

const processValuationJob = async (job: Job) => {
  const { ValuationService } = await import("./valuation/valuation.service");
  const service = new ValuationService();
  await service.run(job.data);
};

const processConditionJob = async (job: Job) => {
  const { ConditionService } = await import("./condition/condition.service");
  const service = new ConditionService();
  await service.run(job.data);
};

const processOnDemandJob = async (job: Job) => {
  const { propertyId, providers } = job.data as {
    propertyId: number;
    providers?: string[];
  };
  const { NycOpenDataService } =
    await import("./nyc-open-data/nyc-open-data.service");
  const nycService = new NycOpenDataService();
  await nycService.runForProperty(propertyId);

  if (!providers || providers.includes("hazard")) {
    const { HazardService } = await import("./hazard/hazard.service");
    await new HazardService().runForProperty(propertyId);
  }
};

export {
  nycDeltaQueue,
  hazardQueue,
  valuationQueue,
  conditionQueue,
  onDemandQueue,
};
