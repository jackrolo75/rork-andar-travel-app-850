import { activitiesStore, type ActivitySearchRecord } from './activities-store';

interface PartnerAdapter {
  id: string;
  name: string;
  isActive: boolean;
  search(params: WorkerSearchParams): Promise<PartnerResult[]>;
}

interface WorkerSearchParams {
  requestId: string;
  destination: string;
  placeId: string | null;
  centroidLat: number | null;
  centroidLon: number | null;
  bboxNorth: number | null;
  bboxSouth: number | null;
  bboxEast: number | null;
  bboxWest: number | null;
  date: string;
  endDate: string | null;
  guests: number;
  category: string | null;
  strictLocation: boolean;
  radiusKm: number;
}

interface PartnerResult {
  activityId: string;
  partnerId: string;
  partnerName: string;
  title: string;
  city: string;
  country: string;
  category: string;
  price: number;
  currency: string;
  geoLat: number | null;
  geoLon: number | null;
  bookingFlow: string;
  deepLink: string | null;
}

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface QueueJob {
  id: string;
  searchParams: WorkerSearchParams;
  status: JobStatus;
  partnerResults: Record<string, number>;
  totalResults: number;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

const jobQueue: QueueJob[] = [];
const jobMap = new Map<string, QueueJob>();
let isProcessing = false;

function createStubbedAdapter(id: string, name: string): PartnerAdapter {
  return {
    id,
    name,
    isActive: true,
    search: async (params: WorkerSearchParams): Promise<PartnerResult[]> => {
      const delay = 300 + Math.random() * 800;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const count = 2 + Math.floor(Math.random() * 4);
      const results: PartnerResult[] = [];

      for (let i = 0; i < count; i++) {
        const lat = params.centroidLat ?? 0;
        const lon = params.centroidLon ?? 0;
        const isNear = Math.random() > 0.2;
        const offsetLat = isNear ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 2;
        const offsetLon = isNear ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 2;

        results.push({
          activityId: `${id}-${params.requestId}-${i}`,
          partnerId: id,
          partnerName: name,
          title: `${params.destination} Activity ${i + 1}`,
          city: params.destination,
          country: 'Various',
          category: params.category || 'culture',
          price: 15 + Math.floor(Math.random() * 180),
          currency: 'USD',
          geoLat: lat + offsetLat,
          geoLon: lon + offsetLon,
          bookingFlow: Math.random() > 0.4 ? 'affiliate_redirect' : 'api',
          deepLink: null,
        });
      }

      console.log(`[Worker] Adapter "${name}" returned ${results.length} results for ${params.requestId}`);
      return results;
    },
  };
}

const partnerAdapters: PartnerAdapter[] = [
  createStubbedAdapter('klook', 'Klook'),
  createStubbedAdapter('tiqets', 'Tiqets'),
  createStubbedAdapter('viator', 'Viator'),
  createStubbedAdapter('tripcom', 'Trip.com'),
  createStubbedAdapter('searadar', 'Searadar'),
  createStubbedAdapter('eatwith', 'EatWith'),
];

export function enqueueSearch(searchRecord: ActivitySearchRecord): string {
  const job: QueueJob = {
    id: searchRecord.requestId,
    searchParams: {
      requestId: searchRecord.requestId,
      destination: searchRecord.destination,
      placeId: searchRecord.placeId,
      centroidLat: searchRecord.centroidLat,
      centroidLon: searchRecord.centroidLon,
      bboxNorth: searchRecord.bboxNorth,
      bboxSouth: searchRecord.bboxSouth,
      bboxEast: searchRecord.bboxEast,
      bboxWest: searchRecord.bboxWest,
      date: searchRecord.date,
      endDate: searchRecord.endDate,
      guests: searchRecord.guests,
      category: searchRecord.category,
      strictLocation: searchRecord.strictLocation,
      radiusKm: searchRecord.radiusKm,
    },
    status: 'queued',
    partnerResults: {},
    totalResults: 0,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    error: null,
  };

  jobQueue.push(job);
  jobMap.set(job.id, job);
  console.log(`[Worker] Job enqueued: ${job.id} (queue depth: ${jobQueue.length})`);

  void processQueue();

  return job.id;
}

export function getJobStatus(jobId: string): QueueJob | null {
  return jobMap.get(jobId) ?? null;
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  while (jobQueue.length > 0) {
    const job = jobQueue.shift();
    if (!job) break;

    job.status = 'processing';
    job.startedAt = Date.now();
    console.log(`[Worker] Processing job: ${job.id}`);

    await activitiesStore.updateSearchStatus(job.id, 'processing');

    try {
      const activeAdapters = partnerAdapters.filter((a) => a.isActive);
      const promises = activeAdapters.map(async (adapter) => {
        try {
          const results = await adapter.search(job.searchParams);
          job.partnerResults[adapter.id] = results.length;
          job.totalResults += results.length;

          for (const result of results) {
            void activitiesStore.persistActivity({
              activityId: result.activityId,
              partnerId: result.partnerId,
              partnerName: result.partnerName,
              title: result.title,
              city: result.city,
              country: result.country,
              category: result.category,
              price: result.price,
              currency: result.currency,
              geoLat: result.geoLat,
              geoLon: result.geoLon,
              bookingFlow: result.bookingFlow,
              deepLink: result.deepLink,
              lastSeen: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });
          }

          return results;
        } catch (err) {
          console.error(`[Worker] Adapter "${adapter.name}" failed for job ${job.id}:`, err);
          job.partnerResults[adapter.id] = 0;
          return [];
        }
      });

      await Promise.all(promises);

      job.status = 'completed';
      job.completedAt = Date.now();
      const elapsedMs = job.completedAt - (job.startedAt ?? job.completedAt);
      console.log(`[Worker] Job completed: ${job.id} | ${job.totalResults} results in ${elapsedMs}ms`);

      await activitiesStore.updateSearchStatus(job.id, 'completed', {
        resultCount: job.totalResults,
        partnerResults: job.partnerResults,
      });
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Unknown error';
      job.completedAt = Date.now();
      console.error(`[Worker] Job failed: ${job.id}`, err);

      await activitiesStore.updateSearchStatus(job.id, 'failed');
    }

    jobMap.set(job.id, job);
  }

  isProcessing = false;
}

export function getQueueStats(): {
  queueDepth: number;
  isProcessing: boolean;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
} {
  const all = Array.from(jobMap.values());
  return {
    queueDepth: jobQueue.length,
    isProcessing,
    totalJobs: all.length,
    completedJobs: all.filter((j) => j.status === 'completed').length,
    failedJobs: all.filter((j) => j.status === 'failed').length,
  };
}
