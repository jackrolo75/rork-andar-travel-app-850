// @ts-nocheck
import Redis from 'ioredis';

interface CachedLoyaltyMember {
  userId: string;
  totalPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  multiplier: number;
}

export class RedisCache {
  private redis: Redis | null = null;
  private readonly DEFAULT_TTL = 3600;
  private readonly POINTS_KEY_PREFIX = 'andar:points:';
  private readonly MERCHANT_KEY_PREFIX = 'andar:merchant:';

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });

        this.redis.on('connect', () => {
          console.log('✅ Redis connected');
        });

        this.redis.on('error', (error) => {
          console.error('❌ Redis error:', error);
        });
      } catch (error) {
        console.error('❌ Failed to initialize Redis:', error);
        this.redis = null;
      }
    } else {
      console.log('⚠️ Redis URL not configured, caching disabled');
    }
  }

  async getMemberPoints(userId: string): Promise<CachedLoyaltyMember | null> {
    if (!this.redis) return null;

    try {
      const key = `${this.POINTS_KEY_PREFIX}${userId}`;
      const cached = await this.redis.get(key);
      
      if (cached) {
        console.log(`🎯 Cache HIT for user ${userId}`);
        return JSON.parse(cached);
      }
      
      console.log(`❌ Cache MISS for user ${userId}`);
      return null;
    } catch (error) {
      console.error('❌ Redis get error:', error);
      return null;
    }
  }

  async setMemberPoints(member: CachedLoyaltyMember, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${this.POINTS_KEY_PREFIX}${member.userId}`;
      await this.redis.setex(key, ttl, JSON.stringify(member));
      console.log(`💾 Cached points for user ${member.userId} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('❌ Redis set error:', error);
    }
  }

  async invalidateMemberPoints(userId: string): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${this.POINTS_KEY_PREFIX}${userId}`;
      await this.redis.del(key);
      console.log(`🗑️ Invalidated cache for user ${userId}`);
    } catch (error) {
      console.error('❌ Redis delete error:', error);
    }
  }

  async getMerchantBalance(merchantId: string): Promise<number | null> {
    if (!this.redis) return null;

    try {
      const key = `${this.MERCHANT_KEY_PREFIX}${merchantId}:balance`;
      const balance = await this.redis.get(key);
      
      if (balance) {
        console.log(`🎯 Cache HIT for merchant ${merchantId}`);
        return parseFloat(balance);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Redis get error:', error);
      return null;
    }
  }

  async setMerchantBalance(merchantId: string, balance: number, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.redis) return;

    try {
      const key = `${this.MERCHANT_KEY_PREFIX}${merchantId}:balance`;
      await this.redis.setex(key, ttl, balance.toString());
      console.log(`💾 Cached balance for merchant ${merchantId}`);
    } catch (error) {
      console.error('❌ Redis set error:', error);
    }
  }

  async incrementPoints(userId: string, points: number): Promise<number | null> {
    if (!this.redis) return null;

    try {
      const key = `${this.POINTS_KEY_PREFIX}${userId}:counter`;
      const newTotal = await this.redis.incrby(key, points);
      await this.redis.expire(key, this.DEFAULT_TTL);
      console.log(`⚡ Incremented points for ${userId}: +${points} = ${newTotal}`);
      return newTotal;
    } catch (error) {
      console.error('❌ Redis increment error:', error);
      return null;
    }
  }

  async invalidateAll(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🗑️ Invalidated ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      console.error('❌ Redis invalidate error:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.redis) return null;

    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('❌ Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttl, value);
    } catch (error) {
      console.error('❌ Redis set error:', error);
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      console.log('👋 Redis disconnected');
    }
  }
}

export const redisCache = new RedisCache();
