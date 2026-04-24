const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

interface ActivityBookingRecord {
  bookingId: string;
  activityId: string;
  partnerId: string | null;
  quoteId: string | null;
  clickId: string | null;
  paymentIntentId?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  amount?: number;
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  confirmedAt?: string | null;
  updatedAt?: string;
}

const BOOKINGS_COLLECTION = 'activity_bookings';
const memoryBookings = new Map<string, ActivityBookingRecord>();

function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DB_TOKEN}`,
  };
}

function getUrl(path: string = ''): string {
  return `${DB_ENDPOINT}/${DB_NAMESPACE}/${BOOKINGS_COLLECTION}${path}`;
}

function useDb(): boolean {
  return !!(DB_ENDPOINT && DB_NAMESPACE && DB_TOKEN);
}

async function dbPut(id: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch(getUrl(`/${id}`), {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
    });
    if (!response.ok) {
      console.error(`[BookingStore] PUT ${id} failed: ${response.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[BookingStore] PUT ${id} error:`, error);
    return false;
  }
}

async function dbGet(id: string): Promise<ActivityBookingRecord | null> {
  try {
    const response = await fetch(getUrl(`/${id}`), {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      console.error(`[BookingStore] GET ${id} failed: ${response.statusText}`);
      return null;
    }
    return (await response.json()) as ActivityBookingRecord;
  } catch (error) {
    console.error(`[BookingStore] GET ${id} error:`, error);
    return null;
  }
}

export const bookingStore = {
  async persist(record: ActivityBookingRecord): Promise<boolean> {
    memoryBookings.set(record.bookingId, record);
    console.log(`[BookingStore] Booking persisted: ${record.bookingId} (activity="${record.activityId}", status=${record.status})`);

    if (useDb()) {
      return dbPut(record.bookingId, record as unknown as Record<string, unknown>);
    }
    return true;
  },

  async get(bookingId: string): Promise<ActivityBookingRecord | null> {
    const mem = memoryBookings.get(bookingId);
    if (mem) return mem;

    if (useDb()) {
      const db = await dbGet(bookingId);
      if (db) {
        memoryBookings.set(bookingId, db);
        return db;
      }
    }
    return null;
  },

  async updateStatus(
    bookingId: string,
    status: ActivityBookingRecord['status'],
    extra?: Partial<ActivityBookingRecord>,
  ): Promise<boolean> {
    const existing = await this.get(bookingId);
    if (!existing) return false;

    const updated: ActivityBookingRecord = {
      ...existing,
      ...extra,
      status,
      updatedAt: new Date().toISOString(),
    };
    memoryBookings.set(bookingId, updated);

    if (useDb()) {
      return dbPut(bookingId, updated as unknown as Record<string, unknown>);
    }
    return true;
  },

  getAllInMemory(): ActivityBookingRecord[] {
    return Array.from(memoryBookings.values());
  },
};

export type { ActivityBookingRecord };
