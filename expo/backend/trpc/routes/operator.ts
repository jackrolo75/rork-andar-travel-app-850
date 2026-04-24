// @ts-nocheck
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { conflictDetector } from '../../services/conflict-detector';

export const operatorRouter = createTRPCRouter({
  detectConflicts: publicProcedure
    .input(
      z.object({
        routeId: z.string(),
        passengers: z.array(
          z.object({
            id: z.string(),
            passengerName: z.string(),
            seatNumber: z.string().optional(),
            dni: z.string().optional(),
            boarded: z.boolean(),
            hasConflict: z.boolean().optional(),
            conflictReason: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      console.log('🔍 Operator: Detecting conflicts', input.routeId);

      const result = conflictDetector.detectConflicts(input.routeId, input.passengers as any);

      return result;
    }),

  registerSeatAssignment: publicProcedure
    .input(
      z.object({
        routeId: z.string(),
        passengerId: z.string(),
        seatNumber: z.string(),
        source: z.enum(['andar', 'window', 'operator']),
        passengerName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log('📝 Operator: Registering seat assignment', input);

      conflictDetector.registerSeatAssignment(
        input.routeId,
        input.passengerId,
        input.seatNumber,
        input.source,
        input.passengerName
      );

      return { success: true };
    }),

  resolveConflict: publicProcedure
    .input(
      z.object({
        routeId: z.string(),
        seatNumber: z.string(),
        winningPassengerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log('🔧 Operator: Resolving conflict', input);

      const result = conflictDetector.resolveConflict(
        input.routeId,
        input.seatNumber,
        input.winningPassengerId
      );

      return result;
    }),

  getConflictStatistics: publicProcedure
    .input(
      z.object({
        routeId: z.string(),
      })
    )
    .query(async ({ input }) => {
      console.log('📊 Operator: Getting conflict statistics', input.routeId);

      const stats = conflictDetector.getConflictStatistics(input.routeId);

      return stats;
    }),
});
