const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

interface ActivitySearchRecord {
  requestId: string;
  destination: string;
  placeId: string | null;
  placeName: string | null;
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
  timeSlot: string | null;
  sortBy: string;
  strictLocation: boolean;
  radiusKm: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  resultCount: number;
  partnerResults: Record<string, number>;
  createdAt: string;
  completedAt: string | null;
}

interface ActivityClickRecord {
  clickId: string;
  activityId: string;
  partnerId: string | null;
  quoteId: string | null;
  userHash: string | null;
  requestId: string | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string | null;
  redirectUrl: string | null;
  partnerUrl: string | null;
  status: 'pending' | 'clicked' | 'converted' | 'expired';
  timestamp: string;
  convertedAt: string | null;
  chosenPartner?: string | null;
  offerPriceCents?: number | null;
  scoreReason?: string | null;
}

interface ActivityRecord {
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
  lastSeen: string;
  createdAt: string;
}

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DB_TOKEN}`,
  };
}

function getUrl(collection: string, path: string = ''): string {
  return `${DB_ENDPOINT}/${DB_NAMESPACE}/${collection}${path}`;
}

async function dbPut<T extends Record<string, unknown>>(collection: string, id: string, data: T): Promise<boolean> {
  try {
    const response = await fetch(getUrl(collection, `/${id}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
    });
    if (!response.ok) {
      console.error(`[ActivitiesStore] PUT ${collection}/${id} failed: ${response.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[ActivitiesStore] PUT ${collection}/${id} error:`, error);
    return false;
  }
}

async function dbGet<T>(collection: string, id: string): Promise<T | null> {
  try {
    const response = await fetch(getUrl(collection, `/${id}`), {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      console.error(`[ActivitiesStore] GET ${collection}/${id} failed: ${response.statusText}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[ActivitiesStore] GET ${collection}/${id} error:`, error);
    return null;
  }
}

const SEARCHES_COLLECTION = 'activity_searches';
const CLICKS_COLLECTION = 'activity_clicks';
const ACTIVITIES_COLLECTION = 'activity_catalog';

const memorySearches = new Map<string, ActivitySearchRecord>();
const memoryClicks = new Map<string, ActivityClickRecord>();
const memoryActivities = new Map<string, ActivityRecord>();

function useDb(): boolean {
  return !!(DB_ENDPOINT && DB_NAMESPACE && DB_TOKEN);
}

export const activitiesStore = {
  async persistSearch(record: ActivitySearchRecord): Promise<boolean> {
    memorySearches.set(record.requestId, record);
    console.log(`[ActivitiesStore] Search persisted: ${record.requestId} (dest="${record.destination}", strict=${record.strictLocation})`);

    if (useDb()) {
      return dbPut(SEARCHES_COLLECTION, record.requestId, record as unknown as Record<string, unknown>);
    }
    return true;
  },

  async getSearch(requestId: string): Promise<ActivitySearchRecord | null> {
    const mem = memorySearches.get(requestId);
    if (mem) return mem;

    if (useDb()) {
      const db = await dbGet<ActivitySearchRecord>(SEARCHES_COLLECTION, requestId);
      if (db) {
        memorySearches.set(requestId, db);
        return db;
      }
    }
    return null;
  },

  async updateSearchStatus(
    requestId: string,
    status: ActivitySearchRecord['status'],
    extra?: Partial<ActivitySearchRecord>,
  ): Promise<boolean> {
    const existing = await this.getSearch(requestId);
    if (!existing) return false;

    const updated: ActivitySearchRecord = {
      ...existing,
      ...extra,
      status,
      completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : existing.completedAt,
    };
    memorySearches.set(requestId, updated);

    if (useDb()) {
      return dbPut(SEARCHES_COLLECTION, requestId, updated as unknown as Record<string, unknown>);
    }
    return true;
  },

  async persistClick(record: ActivityClickRecord): Promise<boolean> {
    memoryClicks.set(record.clickId, record);
    console.log(`[ActivitiesStore] Click persisted: ${record.clickId} (activity="${record.activityId}", partner="${record.partnerId}")`);

    if (useDb()) {
      return dbPut(CLICKS_COLLECTION, record.clickId, record as unknown as Record<string, unknown>);
    }
    return true;
  },

  async getClick(clickId: string): Promise<ActivityClickRecord | null> {
    const mem = memoryClicks.get(clickId);
    if (mem) return mem;

    if (useDb()) {
      const db = await dbGet<ActivityClickRecord>(CLICKS_COLLECTION, clickId);
      if (db) {
        memoryClicks.set(clickId, db);
        return db;
      }
    }
    return null;
  },

  async updateClickStatus(
    clickId: string,
    status: ActivityClickRecord['status'],
  ): Promise<boolean> {
    const existing = await this.getClick(clickId);
    if (!existing) return false;

    const updated: ActivityClickRecord = {
      ...existing,
      status,
      convertedAt: status === 'converted' ? new Date().toISOString() : existing.convertedAt,
    };
    memoryClicks.set(clickId, updated);

    if (useDb()) {
      return dbPut(CLICKS_COLLECTION, clickId, updated as unknown as Record<string, unknown>);
    }
    return true;
  },

  async persistActivity(record: ActivityRecord): Promise<boolean> {
    memoryActivities.set(record.activityId, record);

    if (useDb()) {
      return dbPut(ACTIVITIES_COLLECTION, record.activityId, record as unknown as Record<string, unknown>);
    }
    return true;
  },

  async getActivity(activityId: string): Promise<ActivityRecord | null> {
    const mem = memoryActivities.get(activityId);
    if (mem) return mem;

    if (useDb()) {
      return dbGet<ActivityRecord>(ACTIVITIES_COLLECTION, activityId);
    }
    return null;
  },

  getAllClicksInMemory(): ActivityClickRecord[] {
    return Array.from(memoryClicks.values());
  },

  getAllSearchesInMemory(): ActivitySearchRecord[] {
    return Array.from(memorySearches.values());
  },

  getClicksByActivityInMemory(activityId: string): ActivityClickRecord[] {
    return Array.from(memoryClicks.values()).filter((c) => c.activityId === activityId);
  },

  getConversionStats(): { total: number; converted: number; rate: number } {
    const all = Array.from(memoryClicks.values());
    const converted = all.filter((c) => c.status === 'converted');
    return {
      total: all.length,
      converted: converted.length,
      rate: all.length > 0 ? converted.length / all.length : 0,
    };
  },
};

export type { ActivitySearchRecord, ActivityClickRecord, ActivityRecord };
