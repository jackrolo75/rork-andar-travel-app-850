import type { StripePaymentRecord } from '../types';

const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

const COLLECTION = 'payments';

class PaymentStore {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DB_TOKEN}`,
    };
  }

  private getUrl(path: string = '') {
    return `${DB_ENDPOINT}/${DB_NAMESPACE}/${COLLECTION}${path}`;
  }

  async set(sessionId: string, record: StripePaymentRecord): Promise<void> {
    try {
      const response = await fetch(this.getUrl(`/${sessionId}`), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...record,
          sessionId,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('❌ Failed to save payment record:', response.statusText);
        throw new Error(`Failed to save payment: ${response.statusText}`);
      }

      console.log('✅ Payment record saved to database:', sessionId);
    } catch (error) {
      console.error('❌ Payment store set error:', error);
      throw error;
    }
  }

  async get(sessionId: string): Promise<StripePaymentRecord | null> {
    try {
      const response = await fetch(this.getUrl(`/${sessionId}`), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ Payment record not found:', sessionId);
          return null;
        }
        throw new Error(`Failed to get payment: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Payment record retrieved from database:', sessionId);
      return data as StripePaymentRecord;
    } catch (error) {
      console.error('❌ Payment store get error:', error);
      return null;
    }
  }

  async updateStatus(
    sessionId: string,
    status: StripePaymentRecord['status'],
    additionalFields?: Partial<StripePaymentRecord>
  ): Promise<StripePaymentRecord | null> {
    try {
      const existing = await this.get(sessionId);
      if (!existing) {
        console.error('❌ Cannot update: Payment record not found:', sessionId);
        return null;
      }

      const updated: StripePaymentRecord = {
        ...existing,
        ...additionalFields,
        status,
      };

      await this.set(sessionId, updated);
      return updated;
    } catch (error) {
      console.error('❌ Payment store update error:', error);
      return null;
    }
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<{ sessionId: string; record: StripePaymentRecord } | null> {
    try {
      const response = await fetch(this.getUrl(`?filter=stripePaymentIntentId:${paymentIntentId}`), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const record = data[0] as StripePaymentRecord & { sessionId: string };
        return { sessionId: record.sessionId, record };
      }

      return null;
    } catch (error) {
      console.error('❌ Payment store findByPaymentIntentId error:', error);
      return null;
    }
  }

  async getByBookingId(bookingId: string): Promise<StripePaymentRecord | null> {
    try {
      const response = await fetch(this.getUrl(`?filter=bookingId:${bookingId}`), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        return data[0] as StripePaymentRecord;
      }

      return null;
    } catch (error) {
      console.error('❌ Payment store getByBookingId error:', error);
      return null;
    }
  }

  async listByStatus(status: StripePaymentRecord['status'], limit: number = 100): Promise<StripePaymentRecord[]> {
    try {
      const response = await fetch(this.getUrl(`?filter=status:${status}&limit=${limit}`), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Payment store listByStatus error:', error);
      return [];
    }
  }
}

export const paymentStore = new PaymentStore();
