export interface Taxi {
  id: string;
  plate_number: string;
 type: string;
  driver_id: string;
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
  plateNumber: string;
  driverName: string;
  status: "waiting" | "dispatched";
  arrivalTime: Date;
  destinationId?: string;
  dispatchedAt?: Date;
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

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dispatcher';
  assignedFermatas?: string[];
}
