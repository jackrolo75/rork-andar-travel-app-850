import { KiloPointCalculation } from '../types';
import { redisCache } from './redis-cache';
import { globalInflationAdjuster } from './inflation-adjuster';

interface LoyaltyMember {
  userId: string;
  totalPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  multiplier: number;
}

interface MerchantRedemption {
  merchantId: string;
  merchantName: string;
  qrCode: string;
  pointsRequired: number;
  valueUSD: number;
  cooloffEnds: string;
}

export class LoyaltyLedgerService {
  private members: Map<string, LoyaltyMember> = new Map();
  private readonly COOLOFF_PERIOD_MS = 15 * 60 * 1000;
  private readonly COOLOFF_KEY_PREFIX = 'andar:cooloff:';
  private readonly REDEMPTION_ATTEMPTS_KEY_PREFIX = 'andar:redemption:attempts:';
  private readonly MAX_REDEMPTION_ATTEMPTS = 5;
  private readonly REDEMPTION_ATTEMPT_WINDOW_MS = 60 * 60 * 1000;
  
  calculateKiloPoints(
    userId: string,
    tripDistance: number,
    tripPrice: number,
    tripCurrency: string,
    tripMode: 'bus' | 'flight'
  ): KiloPointCalculation {
    console.log('🎁 Loyalty Ledger: Calculating KiloPoints', {
      userId,
      distance: tripDistance,
      price: tripPrice,
      mode: tripMode,
    });
    
    const vpIndex = this.convertToVP(tripPrice, tripCurrency);
    
    let basePoints = Math.floor(tripDistance * 0.1);
    
    if (tripMode === 'flight') {
      basePoints = Math.floor(basePoints * 1.5);
    }
    
    const member = this.members.get(userId);
    const tierMultiplier = member?.multiplier || 1.0;
    
    let multiplier = 1.0;
    
    if (tripDistance > 1000) {
      multiplier += 0.3;
    } else if (tripDistance > 500) {
      multiplier += 0.15;
    }
    
    multiplier *= tierMultiplier;
    
    const pointsEarned = Math.floor(basePoints * multiplier);
    
    console.log('✅ KiloPoints calculated', {
      basePoints,
      multiplier,
      pointsEarned,
      vpIndex,
    });
    
    return {
      tripId: `trip_${Date.now()}`,
      distance: tripDistance,
      price: tripPrice,
      mode: tripMode,
      vpIndex,
      pointsEarned,
      multiplier,
    };
  }
  
  private convertToVP(amount: number, currency: string): number {
    return globalInflationAdjuster.convertToVP(amount, currency);
  }
  
  async issuePoints(userId: string, points: number): Promise<void> {
    console.log(`💎 Issuing ${points} points to user ${userId}`);
    
    const cached = await redisCache.getMemberPoints(userId);
    
    const member = cached || this.members.get(userId) || {
      userId,
      totalPoints: 0,
      tier: 'bronze' as const,
      multiplier: 1.0,
    };
    
    member.totalPoints += points;
    
    member.tier = this.calculateTier(member.totalPoints);
    member.multiplier = this.getTierMultiplier(member.tier);
    
    this.members.set(userId, member);
    
    await redisCache.setMemberPoints(member);
    await redisCache.incrementPoints(userId, points);
    
    console.log(`✅ Points issued. New total: ${member.totalPoints}, Tier: ${member.tier}`);
  }
  
  private calculateTier(totalPoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (totalPoints >= 10000) return 'platinum';
    if (totalPoints >= 5000) return 'gold';
    if (totalPoints >= 2000) return 'silver';
    return 'bronze';
  }
  
  private getTierMultiplier(tier: string): number {
    switch (tier) {
      case 'platinum': return 2.0;
      case 'gold': return 1.5;
      case 'silver': return 1.25;
      default: return 1.0;
    }
  }
  
  async redeemPoints(
    userId: string,
    pointsToRedeem: number,
    merchantId?: string
  ): Promise<MerchantRedemption | null> {
    console.log(`💰 Redeeming ${pointsToRedeem} points for user ${userId}`);
    
    const attemptCheck = await this.checkRedemptionAttempts(userId);
    if (!attemptCheck.allowed) {
      console.log(`🚨 Fraud prevention: Too many redemption attempts for ${userId}`);
      return null;
    }
    
    const cooloffData = await this.getCooloffFromDB(userId);
    const now = new Date();
    
    if (cooloffData) {
      const cooloffEnds = new Date(cooloffData.cooloffEnds);
      
      if (now < cooloffEnds) {
        const remainingTime = Math.ceil((cooloffEnds.getTime() - now.getTime()) / 1000 / 60);
        console.log(`⏳ Cool-off period active. ${remainingTime} minutes remaining`);
        return null;
      }
    }
    
    const cached = await redisCache.getMemberPoints(userId);
    const member = cached || this.members.get(userId);
    
    if (!member || member.totalPoints < pointsToRedeem) {
      console.log('❌ Insufficient points');
      return null;
    }
    
    member.totalPoints -= pointsToRedeem;
    this.members.set(userId, member);
    
    await redisCache.setMemberPoints(member);
    await redisCache.invalidateMemberPoints(userId);
    
    const cooloffEnds = new Date(now.getTime() + this.COOLOFF_PERIOD_MS).toISOString();
    await this.setCooloffInDB(userId, cooloffEnds);
    await this.recordRedemptionAttempt(userId);
    
    if (merchantId) {
      const qrCode = `ANDAR-${userId}-${Date.now()}-${merchantId}`;
      
      const valueUSD = pointsToRedeem * 0.01;
      
      console.log('✅ Merchant redemption generated', qrCode);
      console.log(`🔒 Cool-off period active until ${cooloffEnds}`);
      
      return {
        merchantId,
        merchantName: 'Terminal Merchant',
        qrCode,
        pointsRequired: pointsToRedeem,
        valueUSD,
        cooloffEnds,
      };
    }
    
    console.log('✅ Points redeemed');
    return null;
  }
  
  async getMemberStatus(userId: string): Promise<LoyaltyMember | null> {
    const cached = await redisCache.getMemberPoints(userId);
    if (cached) {
      return cached;
    }
    return this.members.get(userId) || null;
  }
  
  async getCooloffStatus(userId: string): Promise<{ inCooloff: boolean; remainingMinutes: number }> {
    const cooloffData = await this.getCooloffFromDB(userId);
    
    if (!cooloffData) {
      return { inCooloff: false, remainingMinutes: 0 };
    }
    
    const now = new Date().getTime();
    const cooloffEnds = new Date(cooloffData.cooloffEnds).getTime();
    
    if (now < cooloffEnds) {
      const remainingMinutes = Math.ceil((cooloffEnds - now) / 1000 / 60);
      return { inCooloff: true, remainingMinutes };
    }
    
    return { inCooloff: false, remainingMinutes: 0 };
  }
  
  private async getCooloffFromDB(userId: string): Promise<{ cooloffEnds: string } | null> {
    const key = `${this.COOLOFF_KEY_PREFIX}${userId}`;
    const cached = await redisCache.get(key);
    
    if (!cached) return null;
    
    return JSON.parse(cached);
  }
  
  private async setCooloffInDB(userId: string, cooloffEnds: string): Promise<void> {
    const key = `${this.COOLOFF_KEY_PREFIX}${userId}`;
    const ttl = this.COOLOFF_PERIOD_MS / 1000;
    
    await redisCache.set(
      key,
      JSON.stringify({ cooloffEnds, userId }),
      ttl
    );
    
    console.log(`🔒 Cooloff persisted in DB for ${userId} until ${cooloffEnds}`);
  }
  
  async validateTerminalQR(qrCode: string, userId: string): Promise<boolean> {
    console.log('🔍 Validating terminal QR code', { qrCode, userId });
    
    const isValid = qrCode.startsWith(`ANDAR-${userId}`);
    
    if (isValid) {
      console.log('✅ QR code validated at terminal');
    } else {
      console.log('❌ Invalid QR code');
    }
    
    return isValid;
  }
  
  private async checkRedemptionAttempts(userId: string): Promise<{ allowed: boolean; attempts: number }> {
    const key = `${this.REDEMPTION_ATTEMPTS_KEY_PREFIX}${userId}`;
    const cached = await redisCache.get(key);
    
    if (!cached) {
      return { allowed: true, attempts: 0 };
    }
    
    const data = JSON.parse(cached);
    const attempts = data.attempts || 0;
    
    if (attempts >= this.MAX_REDEMPTION_ATTEMPTS) {
      console.log(`🚨 User ${userId} exceeded max redemption attempts: ${attempts}/${this.MAX_REDEMPTION_ATTEMPTS}`);
      return { allowed: false, attempts };
    }
    
    return { allowed: true, attempts };
  }
  
  private async recordRedemptionAttempt(userId: string): Promise<void> {
    const key = `${this.REDEMPTION_ATTEMPTS_KEY_PREFIX}${userId}`;
    const cached = await redisCache.get(key);
    
    let attempts = 1;
    if (cached) {
      const data = JSON.parse(cached);
      attempts = (data.attempts || 0) + 1;
    }
    
    const ttl = Math.floor(this.REDEMPTION_ATTEMPT_WINDOW_MS / 1000);
    
    await redisCache.set(
      key,
      JSON.stringify({
        userId,
        attempts,
        lastAttempt: new Date().toISOString(),
      }),
      ttl
    );
    
    console.log(`📝 Recorded redemption attempt ${attempts} for user ${userId} (TTL: ${ttl}s)`);
  }
  
  async getRedemptionAttempts(userId: string): Promise<{ attempts: number; lastAttempt?: string }> {
    const key = `${this.REDEMPTION_ATTEMPTS_KEY_PREFIX}${userId}`;
    const cached = await redisCache.get(key);
    
    if (!cached) {
      return { attempts: 0 };
    }
    
    const data = JSON.parse(cached);
    return {
      attempts: data.attempts || 0,
      lastAttempt: data.lastAttempt,
    };
  }
}
