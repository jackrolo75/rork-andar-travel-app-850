import { ManifestPassenger } from '@/types';

interface ConflictResult {
  hasConflict: boolean;
  conflicts: {
    passengerId: string;
    seatNumber: string;
    reason: string;
    severity: 'warning' | 'critical';
  }[];
}

interface SeatAssignment {
  passengerId: string;
  seatNumber: string;
  source: 'andar' | 'window' | 'operator';
  timestamp: string;
  passengerName: string;
}

export class ConflictDetectorService {
  private seatRegistry: Map<string, SeatAssignment[]> = new Map();

  registerSeatAssignment(
    routeId: string,
    passengerId: string,
    seatNumber: string,
    source: 'andar' | 'window' | 'operator',
    passengerName: string
  ): void {
    console.log('📝 Registering seat assignment', {
      routeId,
      passengerId,
      seatNumber,
      source,
    });

    const key = `${routeId}_${seatNumber}`;
    const assignments = this.seatRegistry.get(key) || [];

    assignments.push({
      passengerId,
      seatNumber,
      source,
      timestamp: new Date().toISOString(),
      passengerName,
    });

    this.seatRegistry.set(key, assignments);

    if (assignments.length > 1) {
      console.log('⚠️ DOUBLE BOOKING DETECTED', {
        seatNumber,
        assignments: assignments.length,
      });
    }
  }

  detectConflicts(routeId: string, passengers: ManifestPassenger[]): ConflictResult {
    console.log('🔍 Detecting conflicts for route', routeId);

    const seatMap = new Map<string, ManifestPassenger[]>();

    passengers.forEach((passenger) => {
      if (passenger.seatNumber) {
        const existing = seatMap.get(passenger.seatNumber) || [];
        existing.push(passenger);
        seatMap.set(passenger.seatNumber, existing);
      }
    });

    const conflicts: ConflictResult['conflicts'] = [];

    seatMap.forEach((passengers, seatNumber) => {
      if (passengers.length > 1) {
        passengers.forEach((passenger) => {
          conflicts.push({
            passengerId: passenger.id,
            seatNumber,
            reason: `Asiento ${seatNumber} asignado a ${passengers.length} pasajeros`,
            severity: 'critical',
          });
        });

        console.log('🚨 CONFLICT: Multiple passengers on seat', {
          seatNumber,
          passengers: passengers.map((p) => p.passengerName),
        });
      }
    });

    const key = `${routeId}`;
    this.seatRegistry.forEach((assignments, registryKey) => {
      if (registryKey.startsWith(key)) {
        if (assignments.length > 1) {
          const seatNumber = registryKey.split('_')[1];
          const hasWindowSale = assignments.some((a) => a.source === 'window');
          const hasAndarSale = assignments.some((a) => a.source === 'andar');

          if (hasWindowSale && hasAndarSale) {
            assignments.forEach((assignment) => {
              if (!conflicts.find((c) => c.passengerId === assignment.passengerId)) {
                conflicts.push({
                  passengerId: assignment.passengerId,
                  seatNumber,
                  reason: 'Asiento vendido en ventanilla y ANDAR',
                  severity: 'critical',
                });
              }
            });
          }
        }
      }
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  resolveConflict(
    routeId: string,
    seatNumber: string,
    winningPassengerId: string
  ): { success: boolean; reassignedPassengers: string[] } {
    console.log('🔧 Resolving conflict', {
      routeId,
      seatNumber,
      winningPassengerId,
    });

    const key = `${routeId}_${seatNumber}`;
    const assignments = this.seatRegistry.get(key) || [];

    const reassignedPassengers = assignments
      .filter((a) => a.passengerId !== winningPassengerId)
      .map((a) => a.passengerId);

    this.seatRegistry.set(
      key,
      assignments.filter((a) => a.passengerId === winningPassengerId)
    );

    console.log('✅ Conflict resolved', {
      keptPassenger: winningPassengerId,
      reassignedCount: reassignedPassengers.length,
    });

    return {
      success: true,
      reassignedPassengers,
    };
  }

  getSeatAssignments(routeId: string, seatNumber: string): SeatAssignment[] {
    const key = `${routeId}_${seatNumber}`;
    return this.seatRegistry.get(key) || [];
  }

  clearRoute(routeId: string): void {
    console.log('🗑️ Clearing seat registry for route', routeId);
    const keysToDelete: string[] = [];

    this.seatRegistry.forEach((_, key) => {
      if (key.startsWith(routeId)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.seatRegistry.delete(key));
  }

  getConflictStatistics(routeId: string): {
    totalSeats: number;
    conflictedSeats: number;
    totalAssignments: number;
  } {
    let totalSeats = 0;
    let conflictedSeats = 0;
    let totalAssignments = 0;

    this.seatRegistry.forEach((assignments, key) => {
      if (key.startsWith(routeId)) {
        totalSeats++;
        totalAssignments += assignments.length;
        if (assignments.length > 1) {
          conflictedSeats++;
        }
      }
    });

    return {
      totalSeats,
      conflictedSeats,
      totalAssignments,
    };
  }
}

export const conflictDetector = new ConflictDetectorService();
