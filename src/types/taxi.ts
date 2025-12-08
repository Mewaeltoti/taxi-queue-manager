export interface Taxi {
  id: string;
  plateNumber: string;
  type: 'sedan' | 'suv' | 'van' | 'minibus';
  driverId: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseId: string;
}

export interface Fermata {
  id: string;
  code: string;
  name: string;
}

export interface QueueEntry {
  id: string;
  queueNumber: number;
  taxiId: string;
  plateNumber: string;
  driverName: string;
  arrivalTime: Date;
  status: 'waiting' | 'dispatched';
  dispatchedAt?: Date;
  destinationId?: string;
}

export interface DispatchLog {
  id: string;
  queueEntry: QueueEntry;
  destination: Fermata;
  dispatchedAt: Date;
}

export interface DailyStats {
  totalDispatched: number;
  peakHour: string;
  mostFrequentDestination: string;
  averageWaitTime: number;
}
